export const IMAGE_PROMPT = `Analyze this screen capture and extract contextual information to help answer the user's question.

## What to Extract:
1. **Visible text content**: Headlines, paragraphs, labels, error messages, notifications
2. **UI elements**: Buttons, menus, tabs, forms, input fields - with their labels and states
3. **Visual context**: Active window/tab, app name, current page/section
4. **Data/information**: Tables, charts, code snippets, numerical data visible on screen
5. **Interactive elements**: What the user can click/interact with
6. **System state**: Loading indicators, progress bars, error states, warnings

## User's Question:
{{user_question}}

## Output Format:
Provide a structured extraction focusing on information relevant to answering the question. Organize by:
- **Primary content**: Main focus of the screen (what's most prominent)
- **Relevant details**: Specific text, UI elements, or data that relate to the question
- **Context clues**: App/page identification, current state, available actions

## Critical Rules:
- Focus on content that could answer the user's question
- Be specific about locations and element types
- Include exact text when relevant (error messages, labels, data)
- Note if something is interactive (clickable, editable, selectable)
- If no relevant content found, respond: "No relevant visual content found."
- Do NOT describe irrelevant UI chrome or decorative elements
- Extract code snippets or text blocks verbatim when they're relevant`;