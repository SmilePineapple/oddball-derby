import { createRoot } from 'react-dom/client';
import '@fontsource/lilita-one';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/900.css';
import './index.css';
import { App } from './ui/App';

createRoot(document.getElementById('root')!).render(<App />);
