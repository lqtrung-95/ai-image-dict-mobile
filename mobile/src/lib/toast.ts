import Toast from 'react-native-toast-message';

export function showError(title: string, message?: string) {
  Toast.show({ type: 'error', text1: title, text2: message, visibilityTime: 4000 });
}

export function showSuccess(title: string, message?: string) {
  Toast.show({ type: 'success', text1: title, text2: message, visibilityTime: 3000 });
}

export function showInfo(title: string, message?: string) {
  Toast.show({ type: 'info', text1: title, text2: message, visibilityTime: 3000 });
}
