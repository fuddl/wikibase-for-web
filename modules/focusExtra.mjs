import {
  useState,
  useEffect,
  useRef,
} from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

const useExtraFocus = (shouldFocus, handleMessage, states = []) => {
  const [isFocused, setIsFocused] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (isFocused) {
      // Add the message listener when the input is focused
      browser.runtime.onMessage.addListener(handleMessage);
    } else {
      // Remove the message listener when the input loses focus
      browser.runtime.onMessage.removeListener(handleMessage);
    }

    return () => {
      // Clean up the message listener on component unmount or when isFocused changes
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [isFocused, ...states]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = e => {
    if (e.relatedTarget) {
      setIsFocused(false);
    }
  };

  const handleClickOutside = event => {
    if (
      elementRef?.current?.contains &&
      !elementRef.current.contains(event.target)
    ) {
      setIsFocused(false);
    }
  };

  useEffect(() => {
    // Focus the input field only if shouldFocus is true
    if (shouldFocus && elementRef.current) {
      // use native focus which might fail because the window usually is blurred
      if ('focus' in elementRef.current) {
        elementRef.current.focus();
      }

      //  we still act like the field if focuseds
      setIsFocused(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return { isFocused, elementRef, handleFocus, handleBlur };
};

export default useExtraFocus;
