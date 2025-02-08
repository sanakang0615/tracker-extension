// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
  const maxResults = 20; // 최대 검색 결과 수
  const historyList = document.getElementById('history-list');

  // chrome.history.search()를 사용하여 방문 기록 검색
  chrome.history.search({ text: '', startTime: 0, maxResults: maxResults }, function(results) {
    // 결과가 없으면 안내 메시지 출력
    if (results.length === 0) {
      const li = document.createElement('li');
      li.textContent = '최근 방문 기록이 없습니다.';
      historyList.appendChild(li);
      return;
    }

    // 각 HistoryItem에 대해 리스트 항목 생성
    results.forEach(item => {
      // <li> 요소 생성 (방문 기록 하나당 한 항목)
      const li = document.createElement('li');
      li.className = 'history-item';

      // ──────────────────────────────────────
      // [1] 기본 정보 영역 (파비콘, 링크)
      // ──────────────────────────────────────
      const mainInfo = document.createElement('div');
      mainInfo.className = 'main-info';

      // 파비콘 이미지 생성 (URL에서 도메인을 추출하여 Google의 파비콘 서비스를 이용)
      const favicon = document.createElement('img');
      try {
        const domain = new URL(item.url).hostname;
        favicon.src = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
      } catch (e) {
        // URL이 올바르지 않은 경우 기본 이미지 사용 (프로젝트에 기본 이미지 파일 준비)
        favicon.src = 'default_favicon.png';
      }
      favicon.alt = 'favicon';
      favicon.width = 16;
      favicon.height = 16;
      favicon.style.marginRight = '8px';
      mainInfo.appendChild(favicon);

      // 링크 생성: 제목이 있으면 제목, 없으면 URL 표시, 클릭 시 새 탭에서 열림
      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.title || item.url;
      link.target = '_blank';
      mainInfo.appendChild(link);

      li.appendChild(mainInfo);

      // ──────────────────────────────────────
      // [2] 추가 정보 영역 (ID, 방문 횟수, 타이핑 횟수, 마지막 방문 시간)
      // ──────────────────────────────────────
      const info = document.createElement('div');
      info.className = 'info';
      const lastVisitDate = item.lastVisitTime ? new Date(item.lastVisitTime) : null;
      info.innerHTML = `
        <p><strong>ID:</strong> ${item.id}</p>
        <p><strong>방문 횟수:</strong> ${item.visitCount || 0}</p>
        <p><strong>직접 입력 횟수:</strong> ${item.typedCount || 0}</p>
        <p><strong>마지막 방문:</strong> ${lastVisitDate ? lastVisitDate.toLocaleString() : 'N/A'}</p>
      `;
      li.appendChild(info);

      // ──────────────────────────────────────
      // [3] 방문 상세 정보를 보여주기 위한 버튼 및 컨테이너
      // ──────────────────────────────────────
      const visitsButton = document.createElement('button');
      visitsButton.textContent = '방문 상세 정보 보기';
      visitsButton.className = 'visits-button';
      li.appendChild(visitsButton);

      // 방문 상세 정보를 표시할 컨테이너 (초기엔 숨김)
      const visitsContainer = document.createElement('div');
      visitsContainer.className = 'visits-container';
      visitsContainer.style.display = 'none';
      li.appendChild(visitsContainer);

      // 버튼 클릭 시 chrome.history.getVisits()로 VisitItem(방문 정보) 조회
      visitsButton.addEventListener('click', function() {
        // 현재 숨김 상태이면 방문 상세 정보를 가져옴
        if (visitsContainer.style.display === 'none') {
          chrome.history.getVisits({ url: item.url }, function(visitItems) {
            visitsContainer.innerHTML = ''; // 기존 내용 초기화
            if (visitItems.length === 0) {
              visitsContainer.textContent = '방문 기록이 없습니다.';
            } else {
              const visitsList = document.createElement('ul');
              visitsList.className = 'visits-list';

              visitItems.forEach(visit => {
                const visitLi = document.createElement('li');
                const visitTime = visit.visitTime ? new Date(visit.visitTime).toLocaleString() : 'N/A';
                // VisitItem의 주요 속성: visitId, transition, visitTime, isLocal, referringVisitId
                visitLi.innerHTML = `
                  <p><strong>Visit ID:</strong> ${visit.visitId}</p>
                  <p><strong>Transition:</strong> ${visit.transition}</p>
                  <p><strong>방문 시간:</strong> ${visitTime}</p>
                  <p><strong>로컬 여부:</strong> ${visit.isLocal ? 'Yes' : 'No'}</p>
                  <p><strong>Referring Visit ID:</strong> ${visit.referringVisitId || 'N/A'}</p>
                `;
                visitsList.appendChild(visitLi);
              });
              visitsContainer.appendChild(visitsList);
            }
            visitsContainer.style.display = 'block';
            visitsButton.textContent = '상세 정보 숨기기';
          });
        } else {
          // 이미 보이는 상태이면 숨김 처리
          visitsContainer.style.display = 'none';
          visitsButton.textContent = '방문 상세 정보 보기';
        }
      });

      // 최종적으로 li를 리스트에 추가
      historyList.appendChild(li);
    });
  });
});