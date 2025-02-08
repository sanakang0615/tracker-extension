document.addEventListener('DOMContentLoaded', function() {
  const historyList = document.getElementById('history-list');
  
  // 현재 사용자의 로컬 시간 기준으로 오늘 자정 시각 계산
  function getStartOfToday() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }
  
  // 지난 한 달(1개월) 전 시각 계산
  function getOneMonthAgo() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.getTime();
  }

  // 체류시간(머문 시간) 계산 함수  
  // 연속 방문 간격이 30분 이하인 경우를 하나의 세션으로 보고, 세션당 최대 30분까지만 반영
  function calculateDuration(visits, startTime = 0) {
    if (!visits || visits.length === 0) return 0;
    
    let totalDuration = 0;
    const validVisits = visits.filter(visit => visit.visitTime >= startTime);
    
    // 방문 기록을 시간순으로 정렬
    validVisits.sort((a, b) => a.visitTime - b.visitTime);
    
    // 세션별로 그룹화 (연속 방문 간격이 30분 미만이면 같은 세션)
    let sessions = [];
    let currentSession = [validVisits[0]];
    
    for (let i = 1; i < validVisits.length; i++) {
      const currentVisit = validVisits[i];
      const lastVisit = currentSession[currentSession.length - 1];
      const timeDiff = currentVisit.visitTime - lastVisit.visitTime;
      
      if (timeDiff < 1800000) { // 30분 미만이면 같은 세션
        currentSession.push(currentVisit);
      } else {
        sessions.push(currentSession);
        currentSession = [currentVisit];
      }
    }
    sessions.push(currentSession);
    
    // 각 세션의 체류시간 계산 (최대 30분으로 제한)
    sessions.forEach(session => {
      if (session.length > 1) {
        const sessionDuration = Math.min(
          session[session.length - 1].visitTime - session[0].visitTime,
          1800000 // 최대 30분
        );
        totalDuration += sessionDuration;
      }
    });
    
    return totalDuration;
  }

  // 구글 검색의 경우는 검색어(q 파라미터) 단위로 그룹화하고,
  // 그 외의 경우는 전체 URL(Origin + Pathname)을 기준으로 그룹화하여
  // 네이버 블로그 등 도메인은 같더라도 서로 다른 페이지는 개별 그룹으로 취급하도록 함.
  function getGroupingKey(url) {
    try {
      const urlObj = new URL(url);
      // 구글 검색: hostname이 google.com 또는 www.google.com 이고 pathname이 '/search'인 경우
      if ((urlObj.hostname === 'www.google.com' || urlObj.hostname === 'google.com') && urlObj.pathname === '/search') {
        const query = urlObj.searchParams.get('q');
        if (query) {
          return `${urlObj.hostname}/search?q=${query}`;
        }
      }
      // 그 외는 전체 URL(Origin + Pathname)을 기준으로 그룹화
      return urlObj.origin + urlObj.pathname;
    } catch (e) {
      return url;
    }
  }

  // 방문 기록들을 그룹화하는 함수 (getGroupingKey를 기준으로)
  function groupHistoryByDomain(historyItems) {
    const domainGroups = {};
    
    historyItems.forEach(item => {
      const groupingKey = getGroupingKey(item.url);
      if (!domainGroups[groupingKey]) {
        domainGroups[groupingKey] = {
          groupingKey: groupingKey,
          title: item.title || groupingKey,
          urls: new Set(),
          // chrome.history.search에서 받은 visitCount는 이후 실제 방문 집계로 대체
          totalVisits: item.visitCount || 0,
          lastVisitTime: 0,
          favicon: `https://www.google.com/s2/favicons?sz=32&domain=${groupingKey}`
        };
      }
      
      domainGroups[groupingKey].urls.add(item.url);
      if (item.lastVisitTime > domainGroups[groupingKey].lastVisitTime) {
        domainGroups[groupingKey].lastVisitTime = item.lastVisitTime;
        if (item.title) domainGroups[groupingKey].title = item.title;
      }
    });
    
    return Object.values(domainGroups);
  }

  // 체류시간을 보기 좋게 포맷팅하는 함수 (예: 1시간 32분)
  // 체류시간이 60,000ms(1분) 미만이면 "1분 미만"으로 표시
  function formatDuration(ms) {
    if (ms < 60000) return '1분 미만';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}분`);
    if (seconds % 60 > 0 && hours === 0) parts.push(`${seconds % 60}초`);
    
    return parts.length > 0 ? parts.join(' ') : '1분 미만';
  }

  // 방문 시간을 보기 좋게 포맷팅하는 함수 (예: 2월 7일 22:33)
  // 분 단위로 그룹화하므로 초는 출력하지 않습니다.
  function formatVisitTime(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${month}월 ${day}일 ${hours}:${minutes}`;
  }

  // 방문 기록을 같은 "분 단위"로 그룹화하기 위한 키 생성 함수  
  // (즉, 초와 밀리초를 제거하여 같은 분 내 방문은 하나로 인식)
  function getVisitTimeKey(timestamp) {
    const date = new Date(timestamp);
    date.setSeconds(0, 0);
    return date.getTime();
  }
  
  // 오늘 자정 및 한 달 전 시각 계산 (로컬 타임존 기준)
  const startOfToday = getStartOfToday();
  const oneMonthAgo = getOneMonthAgo();
  
  // chrome.history.search를 호출할 때 지난 한 달 동안의 기록만 가져옴
  chrome.history.search({
    text: '',
    startTime: oneMonthAgo,
    maxResults: 5000
  }, function(results) {
    if (results.length === 0) {
      historyList.innerHTML = '<li>방문 기록이 없습니다.</li>';
      return;
    }
    
    // 그룹 키(전체 URL 또는 구글 검색의 경우 검색어 기반)로 방문 기록들을 그룹화
    const domainGroups = groupHistoryByDomain(results);
    
    // 최신 방문 시간순으로 그룹 정렬
    domainGroups.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
    
    domainGroups.forEach(group => {
      const li = document.createElement('li');
      li.className = 'history-item';
      
      // 기본 정보 (파비콘 및 제목)
      const mainInfo = document.createElement('div');
      mainInfo.className = 'main-info';
      mainInfo.innerHTML = `
        <img src="${group.favicon}" alt="favicon" width="16" height="16" style="margin-right: 8px;">
        <span style="font-weight: bold">${group.title}</span>
      `;
      li.appendChild(mainInfo);
      
      // 통계 정보 (전체 방문수, 전체 체류시간, 오늘 체류시간, 오늘 방문수)
      // 여기서 전체 방문수는 각 그룹(분 단위) 개수로 계산합니다.
      const statsInfo = document.createElement('div');
      statsInfo.className = 'info';
      statsInfo.innerHTML = `
        <p><strong>전체 방문 (한 달 기준):</strong> <span class="total-visits">계산 중...</span></p>
        <p><strong>전체 체류시간 (한 달 기준):</strong> <span class="total-duration">계산 중...</span></p>
        <p><strong>오늘 체류시간:</strong> <span class="today-duration">계산 중...</span></p>
        <p><strong>오늘 방문:</strong> <span class="today-visits">계산 중...</span></p>
      `;
      li.appendChild(statsInfo);
      
      // 방문 시간 목록을 표시할 영역
      const visitsList = document.createElement('div');
      visitsList.className = 'visits-list';
      visitsList.style.marginTop = '10px';
      li.appendChild(visitsList);
      
      // 그룹에 속한 URL들의 방문 기록을 모두 수집
      Promise.all([...group.urls].map(url => {
        return new Promise(resolve => {
          chrome.history.getVisits({ url }, resolve);
        });
      })).then(visitArrays => {
        let allVisits = visitArrays.flat();
        allVisits.sort((a, b) => b.visitTime - a.visitTime);
        
        // → 동일한 '분' 단위로 방문을 그룹화하여 중복 표시 제거 및 집계 처리
        const visitsByMinute = {};
        allVisits.forEach(visit => {
          const key = getVisitTimeKey(visit.visitTime);
          if (!visitsByMinute[key]) {
            visitsByMinute[key] = { visitTime: key, count: 1 };
          } else {
            visitsByMinute[key].count++;
          }
        });
        
        // 그룹별로 정렬 (최신순)
        const groupedVisits = Object.values(visitsByMinute).sort((a, b) => b.visitTime - a.visitTime);
        
        // 전체 방문수와 오늘 방문수를 "각 그룹의 개수"로 계산
        const totalVisitCount = Object.values(visitsByMinute).length;
        const todayVisitCount = Object.values(visitsByMinute)
                                  .filter(entry => entry.visitTime >= startOfToday)
                                  .length;
        
        // 체류시간 계산은 유니크 방문(각 그룹 대표 시각)을 기준으로 진행
        const uniqueVisits = groupedVisits.map(entry => ({ visitTime: entry.visitTime }));
        const totalDuration = calculateDuration(uniqueVisits);
        const todayDuration = calculateDuration(
          uniqueVisits.filter(v => v.visitTime >= startOfToday),
          startOfToday
        );
        
        // 통계 정보 업데이트
        statsInfo.querySelector('.total-duration').textContent = formatDuration(totalDuration);
        statsInfo.querySelector('.today-duration').textContent = formatDuration(todayDuration);
        statsInfo.querySelector('.total-visits').textContent = `${totalVisitCount}회`;
        statsInfo.querySelector('.today-visits').textContent = `${todayVisitCount}회`;
        
        // 최대 50개의 그룹(분 단위)만 표시
        if (groupedVisits.length > 0) {
          const visitTimesList = document.createElement('ul');
          visitTimesList.style.listStyle = 'none';
          visitTimesList.style.padding = '0';
          
          groupedVisits.slice(0, 50).forEach(entry => {
            const visitItem = document.createElement('li');
            visitItem.style.marginBottom = '4px';
            const formattedTime = formatVisitTime(entry.visitTime);
            // 방문 횟수 텍스트는 제거
            visitItem.textContent = `▸ ${formattedTime}`;
            visitTimesList.appendChild(visitItem);
          });
          
          visitsList.appendChild(visitTimesList);
        }
      });
      
      historyList.appendChild(li);
    });
  });
});
