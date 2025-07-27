interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface WebSearchResponse {
  results: SearchResult[];
  query: string;
}

export class WebSearchService {
  private static instance: WebSearchService;
  private apiKey: string;
  
  private constructor() {
    this.apiKey = import.meta.env.VITE_SERPER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ VITE_SERPER_API_KEY not found. Web search will use fallback mode.');
    }
  }
  
  public static getInstance(): WebSearchService {
    if (!WebSearchService.instance) {
      WebSearchService.instance = new WebSearchService();
    }
    return WebSearchService.instance;
  }

  async searchWeb(query: string, maxResults: number = 5): Promise<WebSearchResponse> {
    if (!this.apiKey) {
      console.log('No Serper API key found, using fallback search...');
      return await this.fallbackSearch(query, maxResults);
    }

    try {
      
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          num: maxResults,
          gl: 'br',
          hl: 'pt'
        })
      });

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const results: SearchResult[] = [];
      
      if (data.answerBox) {
        results.push({
          title: data.answerBox.title || 'Resposta Rápida',
          snippet: data.answerBox.answer || data.answerBox.snippet || '',
          url: data.answerBox.link || '#'
        });
      }
      
      if (data.knowledgeGraph && results.length < maxResults) {
        results.push({
          title: data.knowledgeGraph.title || 'Informação',
          snippet: data.knowledgeGraph.description || '',
          url: data.knowledgeGraph.website || '#'
        });
      }
      
      if (data.organic && Array.isArray(data.organic)) {
        for (const result of data.organic.slice(0, maxResults - results.length)) {
          if (result.title && result.snippet && result.link) {
            results.push({
              title: result.title,
              snippet: result.snippet,
              url: result.link
            });
          }
        }
      }
      
      if (data.news && Array.isArray(data.news) && results.length < maxResults) {
        for (const news of data.news.slice(0, maxResults - results.length)) {
          if (news.title && news.snippet && news.link) {
            results.push({
              title: `📰 ${news.title}`,
              snippet: news.snippet,
              url: news.link
            });
          }
        }
      }

      if (results.length === 0) {
        console.log('No results from Serper API, using fallback...');
        return await this.fallbackSearch(query, maxResults);
      }

      return {
        results: results.slice(0, maxResults),
        query
      };
    } catch (error) {
      console.error('Error in Serper API search:', error);
      return await this.fallbackSearch(query, maxResults);
    }
  }

  private async fallbackSearch(query: string, maxResults: number): Promise<WebSearchResponse> {
    try {
      const mockResults: SearchResult[] = [
        {
          title: `Pesquisa: ${query}`,
          snippet: `Resultados de busca para "${query}". Esta é uma implementação básica de busca na web.`,
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
        }
      ];

      return {
        results: mockResults,
        query
      };
    } catch (error) {
      console.error('Error in fallback search:', error);
      return {
        results: [],
        query
      };
    }
  }

  formatSearchResults(searchResponse: WebSearchResponse): string {
    if (searchResponse.results.length === 0) {
      return `Nenhum resultado encontrado para: ${searchResponse.query}`;
    }

    let formatted = `Resultados da busca para "${searchResponse.query}":\n\n`;
    
    searchResponse.results.forEach((result, index) => {
      formatted += `${index + 1}. ${result.title}\n`;
      formatted += `   ${result.snippet}\n`;
      formatted += `   URL: ${result.url}\n\n`;
    });

    return formatted;
  }
}