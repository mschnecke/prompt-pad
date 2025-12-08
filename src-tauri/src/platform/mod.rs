//! Platform-specific functionality for focus management and keyboard simulation

#[cfg(target_os = "macos")]
mod macos;

#[cfg(target_os = "windows")]
mod windows;

use std::sync::Mutex;

/// Stores the previously focused application info
static PREVIOUS_APP: Mutex<Option<PreviousApp>> = Mutex::new(None);

#[derive(Debug, Clone)]
pub struct PreviousApp {
    #[cfg(target_os = "macos")]
    pub pid: i32,
    #[cfg(target_os = "windows")]
    pub hwnd: isize,
}

/// Save the currently focused app before showing the launcher
pub fn save_previous_app() {
    #[cfg(target_os = "macos")]
    {
        if let Some(app) = macos::get_frontmost_app() {
            if let Ok(mut guard) = PREVIOUS_APP.lock() {
                *guard = Some(app);
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Some(app) = windows::get_foreground_window() {
            if let Ok(mut guard) = PREVIOUS_APP.lock() {
                *guard = Some(app);
            }
        }
    }
}

/// Restore focus to the previously saved app
pub fn restore_previous_app() -> bool {
    let app = {
        let guard = PREVIOUS_APP.lock().ok();
        guard.and_then(|g| g.clone())
    };

    if let Some(app) = app {
        #[cfg(target_os = "macos")]
        {
            return macos::activate_app(app.pid);
        }

        #[cfg(target_os = "windows")]
        {
            return windows::set_foreground_window(app.hwnd);
        }
    }

    false
}

/// Simulate Cmd+V (macOS) or Ctrl+V (Windows) paste
pub fn simulate_paste() -> bool {
    #[cfg(target_os = "macos")]
    {
        return macos::simulate_paste();
    }

    #[cfg(target_os = "windows")]
    {
        return windows::simulate_paste();
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        false
    }
}

/// Full paste workflow: restore focus, wait briefly, then paste
pub fn paste_to_previous_app() -> bool {
    // First restore focus
    if !restore_previous_app() {
        return false;
    }

    // Small delay to ensure app is focused
    std::thread::sleep(std::time::Duration::from_millis(100));

    // Simulate paste
    simulate_paste()
}
