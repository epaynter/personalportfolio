import '../styles/globals.css';
import { AnimatePresence } from 'framer-motion';
import { ChatProvider } from '../contexts/ChatContext';
import BackToTop from '../components/BackToTop';
import ChatTrigger from '../components/ChatTrigger';
import CustomCursor from '../components/CustomCursor';
import { Toaster } from 'react-hot-toast';
import { VoiceChatProvider } from '../contexts/VoiceChatContext';
import { PromptProvider } from '../contexts/PromptContext';

function MyApp({ Component, pageProps, router }) {
  return (
    <PromptProvider>
      <ChatProvider>
        <VoiceChatProvider>
          <CustomCursor />
          <AnimatePresence mode="wait">
            <Component {...pageProps} key={router.route} />
          </AnimatePresence>
          <BackToTop />
          <ChatTrigger />
          <Toaster />
        </VoiceChatProvider>
      </ChatProvider>
    </PromptProvider>
  );
}

export default MyApp;