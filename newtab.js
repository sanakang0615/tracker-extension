// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
  const maxResults = 20; // 최대 검색 결과 수
  const historyList = document.getElementById('history-list'); // 데이터를 출력할 UL 요소 선택
  
  // chrome.history.search()를 사용하여 히스토리 데이터를 가져옵니다.
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
      a.textContent = item.title || item.url;
      a.target = '_blank'; // 새 탭에서 링크 열기
      li.appendChild(a);
      
      // 추가 정보(타임스탬프, 방문 횟수 등)를 표시하는 부분 생성
      const info = document.createElement('div');
      info.classList.add('info');

      // lastVisitTime은 밀리초 단위이므로 Date 객체로 변환하여 읽기 쉽게 표시합니다.
      const lastVisitDate = new Date(item.lastVisitTime);
      // 각 속성을 텍스트로 작성 (필요에 따라 포맷을 변경할 수 있음)
      info.textContent = `방문 횟수: ${item.visitCount} / 직접 입력 횟수: ${item.typedCount} / 마지막 방문: ${lastVisitDate.toLocaleString()}`;
      
      li.appendChild(info);
      historyList.appendChild(li);
    });
  });
});