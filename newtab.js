// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
  // 최대 결과 수 (원하는 만큼 조정 가능)
  const maxResults = 20;
  
  // 히스토리 데이터가 렌더링될 UL 요소 선택
  const historyList = document.getElementById('history-list');
  
  // chrome.history.search()를 사용하여 히스토리 데이터를 가져옵니다.
  // text: 빈 문자열이면 모든 기록을 검색합니다.
  // startTime: 0으로 설정하면 가능한 모든 기록을 대상으로 합니다.
  chrome.history.search({ text: '', startTime: 0, maxResults: maxResults }, function(results) {
    // 검색 결과가 없을 경우 처리
    if (results.length === 0) {
      const li = document.createElement('li');
      li.textContent = '최근 방문 기록이 없습니다.';
      historyList.appendChild(li);
      return;
    }
    
    // 각 히스토리 항목에 대해 리스트 아이템 생성
    results.forEach(item => {
      const li = document.createElement('li');
      
      // 링크 생성: 클릭 시 해당 URL을 새 탭에서 열 수 있습니다.
      const a = document.createElement('a');
      a.href = item.url;
      // 기록 제목이 있으면 제목을, 없으면 URL을 표시합니다.
      a.textContent = item.title || item.url;
      a.target = '_blank'; // 새 탭에서 링크 열기
      
      li.appendChild(a);
      historyList.appendChild(li);
    });
  });
});