import { lazy, Suspense, useEffect } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { LauncherWindow } from "./features/launcher/components/LauncherWindow";
import { useAppStore } from "./stores/appStore";

const PromptEditor = lazy(() => import("./features/editor").then(m => ({ default: m.PromptEditor })));
const SettingsPanel = lazy(() => import("./features/settings").then(m => ({ default: m.SettingsPanel })));

const WINDOW_SIZES = {
  launcher: { width: 650, height: 200 },
  editor: { width: 700, height: 550 },
  settings: { width: 650, height: 550 },
};

function App() {
  const { viewMode, editingPrompt, closeEditor, closeSettings } = useAppStore();

  // Resize window based on view
  useEffect(() => {
    const size = WINDOW_SIZES[viewMode];
    const win = getCurrentWindow();
    win.setSize(new LogicalSize(size.width, size.height));
    win.center();
  }, [viewMode]);

  if (viewMode === 'editor') {
    return (
      <Suspense fallback={null}>
        <PromptEditor
          prompt={editingPrompt}
          onSave={(savedPrompt) => {
            console.log('Prompt saved:', savedPrompt);
            closeEditor();
          }}
          onClose={closeEditor}
          onDelete={closeEditor}
        />
      </Suspense>
    );
  }

  if (viewMode === 'settings') {
    return (
      <Suspense fallback={null}>
        <SettingsPanel onClose={closeSettings} />
      </Suspense>
    );
  }

  return <LauncherWindow />;
}

export default App;
