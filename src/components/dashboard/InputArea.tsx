import { RefObject } from 'react';
import { Upload, Mic, Zap, X, Loader2, File, Image } from 'lucide-react';

export interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  content?: string;
  progress: number;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  return File;
};

interface InputAreaProps {
  inputRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isParsing: boolean;
  isOffline: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
  recordingTime: number;
  formatTime: (s: number) => string;
  attachedFiles: AttachedFile[];
  onRemoveFile: (id: string) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  acceptString: string;
  emptyInputShake: boolean;
}

const InputArea = ({
  inputRef, value, onChange, onGenerate, isParsing, isOffline,
  isRecording, onToggleRecording, recordingTime, formatTime,
  attachedFiles, onRemoveFile, fileInputRef, onFileInputChange, acceptString,
  emptyInputShake,
}: InputAreaProps) => {
  return (
    <div className={`mb-6 sm:mb-8 max-w-2xl mx-auto rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4 sm:p-5 transition-transform shadow-lg shadow-primary/5 ${emptyInputShake ? 'animate-shake' : ''}`}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
        placeholder={emptyInputShake ? 'Drop some thoughts first' : 'Brain dump your thoughts here...'}
        className={`w-full min-h-[48px] sm:min-h-[56px] bg-transparent text-foreground resize-none text-sm focus:outline-none transition-colors ${emptyInputShake ? 'placeholder:text-red-500/50' : 'placeholder:text-muted-foreground/40'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            onGenerate();
          }
        }}
      />

      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 mb-1">
          {attachedFiles.map((af) => {
            const FileIcon = getFileIcon(af.type);
            return (
              <div key={af.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-foreground/80">
                <FileIcon className="w-3 h-3 text-accent/60" />
                <span className="max-w-[120px] truncate">{af.name}</span>
                <button
                  onClick={() => onRemoveFile(af.id)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileInputChange}
            accept={acceptString}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg transition-colors text-white/60 hover:text-white hover:bg-accent/10"
            title="Attach files"
          >
            <Upload className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-border/30 mx-1" />
          <button
            onClick={onToggleRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording ? 'bg-red-500/20 text-red-400' : 'text-white/60 hover:text-white hover:bg-accent/10'
            }`}
            title="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>
          {isRecording && (
            <span className="text-xs text-red-400 font-mono ml-1">{formatTime(recordingTime)}</span>
          )}
        </div>
        <button
          onClick={onGenerate}
          disabled={isParsing || isOffline}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-primary-foreground brand-gradient disabled:opacity-40 transition-opacity"
        >
          {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Generate
        </button>
      </div>
      {isOffline && (
        <p className="text-xs text-muted-foreground mt-2">You're offline. Reconnect to generate.</p>
      )}
    </div>
  );
};

export default InputArea;
