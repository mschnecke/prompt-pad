use std::sync::Mutex;

static PREVIOUS_APP: Mutex<Option<PreviousApp>> = Mutex::new(None);

#[derive(Clone)]
struct PreviousApp {
    #[allow(dead_code)]
    name: Option<String>,
    #[cfg(target_os = "macos")]
    #[allow(dead_code)]
    pid: Option<i32>,
    #[cfg(target_os = "windows")]
    hwnd: Option<isize>,
}

pub fn save_previous_app() {
    let mut prev = PREVIOUS_APP.lock().unwrap();

    #[cfg(target_os = "macos")]
    {
        *prev = Some(get_macos_frontmost_app());
    }

    #[cfg(target_os = "windows")]
    {
        *prev = Some(get_windows_foreground_window());
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        *prev = None;
    }
}

pub fn get_previous_app_name() -> Option<String> {
    let prev = PREVIOUS_APP.lock().unwrap();
    prev.as_ref().and_then(|p| p.name.clone())
}

pub fn restore_and_paste() -> Result<(), String> {
    let prev = PREVIOUS_APP.lock().unwrap();

    if prev.is_none() {
        return Err("No previous app to restore".to_string());
    }

    let prev_app = prev.clone().unwrap();
    drop(prev);

    #[cfg(target_os = "macos")]
    {
        restore_macos_app(&prev_app)?;
        simulate_macos_paste()?;
    }

    #[cfg(target_os = "windows")]
    {
        restore_windows_app(&prev_app)?;
        simulate_windows_paste()?;
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = prev_app;
    }

    Ok(())
}

// macOS implementation using std::process::Command for AppleScript
#[cfg(target_os = "macos")]
fn get_macos_frontmost_app() -> PreviousApp {
    use std::process::Command;

    // Get frontmost app info using AppleScript
    let output = Command::new("osascript")
        .args([
            "-e",
            r#"tell application "System Events" to get {name, unix id} of first process whose frontmost is true"#,
        ])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let parts: Vec<&str> = stdout.trim().split(", ").collect();
            if parts.len() >= 2 {
                let name = Some(parts[0].to_string());
                let pid = parts[1].parse::<i32>().ok();
                PreviousApp { name, pid }
            } else {
                PreviousApp {
                    name: None,
                    pid: None,
                }
            }
        }
        Err(_) => PreviousApp {
            name: None,
            pid: None,
        },
    }
}

#[cfg(target_os = "macos")]
fn restore_macos_app(prev: &PreviousApp) -> Result<(), String> {
    use std::process::Command;

    if let Some(ref name) = prev.name {
        // Activate app using AppleScript
        let script = format!(r#"tell application "{}" to activate"#, name);
        let _ = Command::new("osascript").args(["-e", &script]).output();
        std::thread::sleep(std::time::Duration::from_millis(100));
    }

    Ok(())
}

#[cfg(target_os = "macos")]
fn simulate_macos_paste() -> Result<(), String> {
    use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation};
    use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

    let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState)
        .map_err(|_| "Failed to create event source")?;

    // Key down for V (keycode 9) with Command modifier
    let event_down = CGEvent::new_keyboard_event(source.clone(), 9, true)
        .map_err(|_| "Failed to create key down event")?;
    event_down.set_flags(CGEventFlags::CGEventFlagCommand);
    event_down.post(CGEventTapLocation::HID);

    std::thread::sleep(std::time::Duration::from_millis(10));

    // Key up for V
    let event_up = CGEvent::new_keyboard_event(source, 9, false)
        .map_err(|_| "Failed to create key up event")?;
    event_up.set_flags(CGEventFlags::CGEventFlagCommand);
    event_up.post(CGEventTapLocation::HID);

    Ok(())
}

// Windows implementation
#[cfg(target_os = "windows")]
fn get_windows_foreground_window() -> PreviousApp {
    use windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow;

    let hwnd = unsafe { GetForegroundWindow() };

    PreviousApp {
        name: None,
        hwnd: Some(hwnd.0 as isize),
    }
}

#[cfg(target_os = "windows")]
fn restore_windows_app(prev: &PreviousApp) -> Result<(), String> {
    use windows::Win32::UI::WindowsAndMessaging::{SetForegroundWindow, HWND};

    if let Some(hwnd) = prev.hwnd {
        unsafe {
            let _ = SetForegroundWindow(HWND(hwnd as *mut _));
        }
        std::thread::sleep(std::time::Duration::from_millis(50));
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn simulate_windows_paste() -> Result<(), String> {
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VIRTUAL_KEY,
    };

    const VK_CONTROL: VIRTUAL_KEY = VIRTUAL_KEY(0x11);
    const VK_V: VIRTUAL_KEY = VIRTUAL_KEY(0x56);

    let inputs: [INPUT; 4] = [
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_CONTROL,
                    wScan: 0,
                    dwFlags: Default::default(),
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_V,
                    wScan: 0,
                    dwFlags: Default::default(),
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_V,
                    wScan: 0,
                    dwFlags: KEYEVENTF_KEYUP,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_CONTROL,
                    wScan: 0,
                    dwFlags: KEYEVENTF_KEYUP,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
    ];

    unsafe {
        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
    }

    Ok(())
}
