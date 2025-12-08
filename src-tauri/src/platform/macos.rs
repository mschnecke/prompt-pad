//! macOS-specific focus management and keyboard simulation

#[allow(deprecated)] // cocoa/objc crates recommend objc2, but migration is non-trivial
#[allow(unexpected_cfgs)] // old objc macro uses cargo-clippy cfg
mod inner {
    use super::super::PreviousApp;
    use cocoa::base::{id, nil};
    use cocoa::foundation::NSAutoreleasePool;
    use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation, CGKeyCode};
    use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
    use objc::{class, msg_send, sel, sel_impl};

    /// Key code for 'V' on macOS
    const KEY_V: CGKeyCode = 9;

    /// Get the frontmost (currently active) application
    pub fn get_frontmost_app() -> Option<PreviousApp> {
        unsafe {
            let _pool = NSAutoreleasePool::new(nil);

            let workspace: id = msg_send![class!(NSWorkspace), sharedWorkspace];
            let frontmost: id = msg_send![workspace, frontmostApplication];

            if frontmost == nil {
                return None;
            }

            let pid: i32 = msg_send![frontmost, processIdentifier];

            // Don't save our own app as the previous app
            let current_pid = std::process::id() as i32;
            if pid == current_pid {
                return None;
            }

            Some(PreviousApp { pid })
        }
    }

    /// Activate an application by its PID
    pub fn activate_app(pid: i32) -> bool {
        unsafe {
            let _pool = NSAutoreleasePool::new(nil);

            let app: id = msg_send![
                class!(NSRunningApplication),
                runningApplicationWithProcessIdentifier: pid
            ];

            if app == nil {
                return false;
            }

            // NSApplicationActivateIgnoringOtherApps = 1 << 1 = 2
            let options: usize = 2;
            let result: bool = msg_send![app, activateWithOptions: options];

            result
        }
    }

    /// Simulate Cmd+V paste keystroke
    pub fn simulate_paste() -> bool {
        let source = match CGEventSource::new(CGEventSourceStateID::HIDSystemState) {
            Ok(s) => s,
            Err(_) => return false,
        };

        // Create key down event for 'V'
        let key_down = match CGEvent::new_keyboard_event(source.clone(), KEY_V, true) {
            Ok(e) => e,
            Err(_) => return false,
        };

        // Create key up event for 'V'
        let key_up = match CGEvent::new_keyboard_event(source, KEY_V, false) {
            Ok(e) => e,
            Err(_) => return false,
        };

        // Set Command modifier
        key_down.set_flags(CGEventFlags::CGEventFlagCommand);
        key_up.set_flags(CGEventFlags::CGEventFlagCommand);

        // Post events
        key_down.post(CGEventTapLocation::HID);
        key_up.post(CGEventTapLocation::HID);

        true
    }
}

pub use inner::*;
