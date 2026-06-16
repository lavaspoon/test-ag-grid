// AI 노드 미리보기용 목업 (백엔드/LLM 연동 전)

export const MOCK_AI_RESULT = {
  summary: '요금 관련 VOC가 전주 대비 18% 증가했습니다. AHT 이상 구간(정현우 430초)이 감지되었습니다.',
  insights: [
    { title: '신규 요금제 출시 영향', impact: 'high' },
    { title: '프로모션 종료', impact: 'medium' },
    { title: '로밍 VOC 감소 (-10%)', impact: 'low' },
  ],
  metrics: { prev: 312, curr: 368, changePct: 18.0 },
};
