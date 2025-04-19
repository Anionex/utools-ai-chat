// 显示通知
function showNotification(message, type = 'info', duration = 3000) {
    // 设置通知内容和类型
    notificationContent.textContent = message;
    notification.className = `notification ${type}`;
    
    // 显示通知
    notification.classList.add('show');
    
    // 设置自动关闭
    setTimeout(() => {
      hideNotification();
    }, duration);
  }
  
  // 隐藏通知
function hideNotification() {
    notification.classList.remove('show');
}
// 设置通知关闭按钮事件
notificationClose.addEventListener('click', hideNotification);