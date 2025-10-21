import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from 'lucide-react';
import { ChevronLeft, ChevronRight, Edit3, Save, Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

// Custom DialogContent without overlay
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
CustomDialogContent.displayName = "CustomDialogContent";

const SettingsInterface = ({
  setShowSettings,
}: {
  setShowSettings: (show: boolean) => void;
}) => {
  const [isProtected, setIsProtected] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState<boolean>(false);
  const [hasCustomPrompt, setHasCustomPrompt] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    window.electronAPI?.getContentProtectionStatus?.().then((status) => {
      if (typeof status === 'boolean') setIsProtected(status);
    });
    
    // Load custom prompt
    loadCustomPrompt();
  }, []);

  const loadCustomPrompt = async () => {
    try {
      const result = await window.electronAPI?.loadCustomPrompt?.();
      if (result?.success) {
        setCustomPrompt(result.prompt || '');
        setHasCustomPrompt(result.exists);
      }
    } catch (error) {
      console.error('Error loading custom prompt:', error);
    }
  };

  const handleToggleProtection = async () => {
    const newStatus = !(isProtected);
    const result = await window.electronAPI?.setContentProtection?.(newStatus);
    if (typeof result === 'boolean') setIsProtected(result);
  };

  const moveLeft = () => {
    window.electronAPI?.moveWindow?.(-50, 0);
  };

  const moveRight = () => {
    window.electronAPI?.moveWindow?.(50, 0);
  };

  const handleSaveCustomPrompt = async () => {
    if (!customPrompt.trim()) return;
    
    setIsSaving(true);
    try {
      const result = await window.electronAPI?.saveCustomPrompt?.(customPrompt);
      if (result?.success) {
        setHasCustomPrompt(true);
        setIsPromptDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving custom prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomPrompt = async () => {
    try {
      const result = await window.electronAPI?.deleteCustomPrompt?.();
      if (result?.success) {
        setCustomPrompt('');
        setHasCustomPrompt(false);
      }
    } catch (error) {
      console.error('Error deleting custom prompt:', error);
    }
  };

  const handleQuit = async () => {
    try {
      await window.electronAPI?.quitApp?.();
    } catch (error) {
      console.error('Error quitting app:', error);
    }
  };

  return (
    <Card className="w-[200px] bg-gray-900/95 backdrop-blur-sm border-gray-700 text-gray-300 pointer-events-auto">
      <CardContent className="p-2 pt-0">
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-400">
              Custom Prompt
            </label>
            <div className="flex items-center gap-2 mt-1">
              <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="xs"
                    className="w-full text-gray-300 border-gray-600 hover:bg-gray-700 h-7 justify-start"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    {hasCustomPrompt ? 'Edit Prompt' : 'Create Prompt'}
                  </Button>
                </DialogTrigger>
                <CustomDialogContent className="bg-gray-900 border-gray-700 text-gray-300 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-gray-300">
                      {hasCustomPrompt ? 'Edit Custom Prompt' : 'Create Custom Prompt'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">
                        Your custom prompt:
                      </label>
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Enter your custom prompt here... Ex: Always respond in a technical and detailed manner."
                        className="bg-gray-800 border-gray-600 text-gray-300 min-h-[120px] resize-none focus:outline-none focus:ring-0 focus:border-gray-600"
                        rows={6}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      {hasCustomPrompt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeleteCustomPrompt}
                          className="text-red-400 border-red-600 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPromptDialogOpen(false)}
                        className="text-gray-300 border-gray-600 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveCustomPrompt}
                        disabled={!customPrompt.trim() || isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CustomDialogContent>
              </Dialog>
            </div>
            {hasCustomPrompt && (
              <p className="text-xs text-green-400 mt-1">
                ✓ Custom prompt active
              </p>
            )}
          </div>



          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex justify-between items-center">
              <span>Scroll Response</span>
              <div className="flex gap-1 items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                  Ctrl
                </kbd>
                <div className="flex flex-col gap-0.5">
                  <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs text-gray-300 leading-none">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs text-gray-300 leading-none">
                    ↓
                  </kbd>
                </div>
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
              onClick={moveLeft}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Move
            </Button>
            <Button
              variant="outline"
              size="xs"
              className="text-gray-300 border-gray-600 hover:bg-gray-700 h-7"
              onClick={moveRight}
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
            onClick={handleToggleProtection}
          >
            {isProtected ? 'Disable Invisibility' : 'Enable Invisibility'}
          </Button>

          <Button variant="destructive" size="xs" className="w-full h-7" onClick={handleQuit}>
            Quit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsInterface; 