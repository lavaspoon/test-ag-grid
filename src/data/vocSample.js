// VOC 샘플 데이터 — DB 조회·Transform 미리보기용

export const vocColumns = [
  { field: 'date', headerName: '일자', width: 110 },
  { field: 'voc_type', headerName: 'VOC 유형', flex: 1 },
  { field: 'agent', headerName: '상담사', flex: 1 },
  { field: 'department', headerName: '부서', flex: 1 },
  { field: 'inbound', headerName: '인입', width: 90 },
  { field: 'answered', headerName: '응대', width: 90 },
  { field: 'aht', headerName: 'AHT(초)', width: 100 },
];

export const vocData = [
  { date: '2026-06-16', voc_type: '요금', agent: '김민수', department: '고객센터', inbound: 45, answered: 42, aht: 280 },
  { date: '2026-06-16', voc_type: '요금', agent: '이서연', department: '고객센터', inbound: 38, answered: 36, aht: 265 },
  { date: '2026-06-16', voc_type: '해지', agent: '박지훈', department: '리텐션', inbound: 22, answered: 20, aht: 420 },
  { date: '2026-06-16', voc_type: '로밍', agent: '최유진', department: '고객센터', inbound: 15, answered: 14, aht: 190 },
  { date: '2026-06-16', voc_type: '요금', agent: '정현우', department: '고객센터', inbound: 52, answered: 48, aht: 430 },
  { date: '2026-06-16', voc_type: '해지', agent: '한소희', department: '리텐션', inbound: 18, answered: 17, aht: 390 },
  { date: '2026-06-16', voc_type: '로밍', agent: '오대성', department: '고객센터', inbound: 12, answered: 11, aht: 175 },
  { date: '2026-06-16', voc_type: '기타', agent: '윤채원', department: '고객센터', inbound: 8, answered: 7, aht: 210 },
];

export const vocAggregated = {
  columns: [
    { field: 'voc_type', headerName: 'VOC 유형' },
    { field: 'count', headerName: '건수' },
    { field: 'avg_aht', headerName: '평균 AHT' },
    { field: 'prev_count', headerName: '전주 건수' },
    { field: 'change_pct', headerName: '증감(%)' },
  ],
  rows: [
    { voc_type: '요금', count: 135, avg_aht: 325, prev_count: 114, change_pct: 18.4 },
    { voc_type: '해지', count: 40, avg_aht: 405, prev_count: 38, change_pct: 5.3 },
    { voc_type: '로밍', count: 27, avg_aht: 182, prev_count: 30, change_pct: -10.0 },
  ],
};
