import { useState, useEffect, useCallback, useRef } from 'react';

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useSpeechRecognition(onFinalSentence?: (text: string) => void, autoStart: boolean = false) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Use a ref for the callback so it doesn't cause re-renders or stale closures in the event listener
  const onFinalSentenceRef = useRef(onFinalSentence);
  useEffect(() => {
    onFinalSentenceRef.current = onFinalSentence;
  }, [onFinalSentence]);

  const shouldListenRef = useRef(autoStart);
  
  useEffect(() => {
    shouldListenRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognitionAPI();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }

      if (finalStr.trim() && onFinalSentenceRef.current) {
        onFinalSentenceRef.current(finalStr.trim());
      }
      setInterimTranscript(interimStr);
    };

    rec.onstart = () => {
      setIsListening(true);
      shouldListenRef.current = true;
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        setIsListening(false);
        shouldListenRef.current = false;
      }
    };

    rec.onend = () => {
      if (shouldListenRef.current) {
        try {
          rec.start();
        } catch (e) {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;

    // We don't auto-start here because browsers block SpeechRecognition without a user gesture.
    // We will rely on the user clicking the "Start" button in the sidebar.
    // If autoStart is true, we can try, but it might fail.
    if (autoStart) {
      try {
        rec.start();
      } catch (e) {
        console.error("Failed to auto-start speech recognition", e);
      }
    }

    return () => {
      rec.stop();
    };
  }, [autoStart]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  }, [isListening]);

  return {
    isListening,
    toggleListening,
    interimTranscript,
    isSupported: !!SpeechRecognitionAPI
  };
}
