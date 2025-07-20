import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Paperclip, ChevronLeft, ChevronRight } from 'lucide-react';

const SettingsInterface = ({
  setShowSettings,
}: {
  setShowSettings: (show: boolean) => void;
}) => {
  return (
    <Card className="w-[200px] bg-gray-900/95 backdrop-blur-sm border-gray-700 text-gray-300 absolute top-12 z-10 right-0">
      <CardContent className="p-2 pt-0">
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-400">
              Prompt
            </label>
            <div className="flex items-center gap-2 mt-1">
              <Select defaultValue="default">
                <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-gray-300 h-7 text-xs rounded-md">
                  <SelectValue placeholder="Select prompt" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-gray-300 border-gray-600">
                  <SelectItem value="default" className="text-xs">Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-blue-400 mt-1 text-xs"
            >
              Personalize
            </Button>
          </div>

          <div>
            <p className="text-xs">
              <span className="text-gray-400">Account:</span>{' '}
              <span className="font-mono">teste@gmail...</span>
            </p>
          </div>

          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex justify-between items-center">
              <span>Scroll Response</span>
              <div className="flex gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                  Ctrl
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                  ↑
                </kbd>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Clear Response</span>
              <div className="flex gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                  Ctrl
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                  R
                </kbd>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="xs"
              className="text-gray-300 border-gray-600 hover:bg-gray-700 h-7"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Move
            </Button>
            <Button
              variant="outline"
              size="xs"
              className="text-gray-300 border-gray-600 hover:bg-gray-700 h-7"
            >
              Move
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* <Button
            variant="outline"
            size="xs"
            className="w-full text-gray-300 border-gray-600 hover:bg-gray-700 h-7"
          >
            Show Tutorial
          </Button> */}
          <Button
            variant="outline"
            size="xs"
            className="w-full text-gray-300 border-gray-600 hover:bg-gray-700 h-7"
          >
            Disable Invisibility
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xs"
              className="w-full text-gray-300 border-gray-600 hover:bg-gray-700 h-7"
            >
              Log Out
            </Button>
            <Button variant="destructive" size="xs" className="w-full h-7">
              Quit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsInterface; 