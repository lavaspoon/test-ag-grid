// 샘플 직원 데이터 — AG Grid 소스 그리드에서 사용
export const employeeColumns = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: '이름', flex: 1 },
  { field: 'department', headerName: '부서', flex: 1 },
  { field: 'position', headerName: '직급', flex: 1 },
  { field: 'salary', headerName: '연봉(만원)', flex: 1, valueFormatter: (p) => p.value?.toLocaleString() },
  { field: 'hireDate', headerName: '입사일', flex: 1 },
  { field: 'region', headerName: '근무지', flex: 1 },
];

export const employeeData = [
  { id: 1, name: '김민수', department: '영업', position: '과장', salary: 6200, hireDate: '2018-03-12', region: '서울' },
  { id: 2, name: '이서연', department: '개발', position: '대리', salary: 5400, hireDate: '2020-07-01', region: '판교' },
  { id: 3, name: '박지훈', department: '개발', position: '차장', salary: 7800, hireDate: '2015-11-23', region: '판교' },
  { id: 4, name: '최유진', department: '마케팅', position: '사원', salary: 3900, hireDate: '2022-01-10', region: '서울' },
  { id: 5, name: '정현우', department: '영업', position: '부장', salary: 9100, hireDate: '2012-05-19', region: '부산' },
  { id: 6, name: '한소희', department: '인사', position: '대리', salary: 5100, hireDate: '2019-09-30', region: '서울' },
  { id: 7, name: '오대성', department: '개발', position: '과장', salary: 6700, hireDate: '2017-02-14', region: '판교' },
  { id: 8, name: '윤채원', department: '마케팅', position: '과장', salary: 6400, hireDate: '2016-08-08', region: '서울' },
  { id: 9, name: '임도현', department: '재무', position: '차장', salary: 7500, hireDate: '2014-04-21', region: '부산' },
  { id: 10, name: '강하늘', department: '재무', position: '사원', salary: 4100, hireDate: '2023-03-02', region: '서울' },
  { id: 11, name: '서지안', department: '인사', position: '부장', salary: 8800, hireDate: '2011-10-17', region: '서울' },
  { id: 12, name: '문가람', department: '영업', position: '대리', salary: 5300, hireDate: '2021-06-15', region: '대구' },
];
