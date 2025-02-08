document.addEventListener('DOMContentLoaded', function() {
  const maxResults = 20; 
  const historyList = document.getElementById('history-list'); 
  
  chrome.history.search({ text: '', startTime: 0, maxResults: maxResults }, function(results) {
    if (results.length === 0) {
      const li = document.createElement('li');
      li.textContent = '최근 방문 기록이 없습니다.';
      historyList.appendChild(li);
      return;
    }
    
    results.forEach(item => {
      const li = document.createElement('li');

      // 파비콘 이미지 생성
      const favicon = document.createElement('img');
      const domain = new URL(item.url).hostname;
      favicon.src = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
      favicon.alt = 'favicon';
      favicon.width = 16;
      favicon.height = 16;
      favicon.style.marginRight = '8px';

      // 링크 생성
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title || item.url;
      a.target = '_blank'; 

      // 추가 정보
      const info = document.createElement('div');
      info.classList.add('info');
      const lastVisitDate = new Date(item.lastVisitTime);
      info.textContent = `방문 횟수: ${item.visitCount} / 직접 입력 횟수: ${item.typedCount} / 마지막 방문: ${lastVisitDate.toLocaleString()}`;

      // 요소 추가
      li.appendChild(favicon);
      li.appendChild(a);
      li.appendChild(info);
      historyList.appendChild(li);
    });
  });
});
