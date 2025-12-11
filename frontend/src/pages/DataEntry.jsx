// src/views/data/DataEntry.js
import React, { useState } from "react";
import { CCard, CCardBody, CTable, CTableHead, CTableBody, CTableRow, CTableHeaderCell, CTableDataCell, CFormInput } from "@coreui/react";
import { PageHeaderCard } from '../components/index.jsx';

// FontAwesome Icon component
const FaIcon = ({ icon, className = '', style = {} }) => (
  <i className={`fas ${icon} ${className}`} style={style} />
);

const initialData = [
  { id: 1, name: "الحظيرة 1", production: 100, feed: 50, water: 100, vaccination: "✔", mortality: 2, sold: 20 },
  { id: 2, name: "الحظيرة 2", production: 120, feed: 60, water: 120, vaccination: "✔", mortality: 1, sold: 30 },
];

const DataEntry = () => {
  const [data, setData] = useState(initialData);

  const handleChange = (id, key, value) => {
    const newData = data.map((row) => (row.id === id ? { ...row, [key]: value } : row));
    setData(newData);
  };

  const totalProduction = data.reduce((sum, row) => sum + Number(row.production), 0);
  const totalSold = data.reduce((sum, row) => sum + Number(row.sold), 0);
  const remaining = totalProduction - totalSold;

  return (
    <div dir="rtl" className="page-container" style={{ background: 'var(--dashboard-bg, #f5f6fa)', minHeight: '100vh' }}>
      <PageHeaderCard
        title="إدخال البيانات اليومية"
        subtitle="إدخال البيانات والإحصائيات اليومية"
        icon={<FaIcon icon="fa-edit" />}
      />
      <CCard>
        <CCardBody>
          <CTable striped bordered>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>الحظيرة</CTableHeaderCell>
                <CTableHeaderCell>الإنتاج</CTableHeaderCell>
                <CTableHeaderCell>العلف (كجم)</CTableHeaderCell>
                <CTableHeaderCell>الماء (لتر)</CTableHeaderCell>
                <CTableHeaderCell>التحصين</CTableHeaderCell>
                <CTableHeaderCell>النفوق</CTableHeaderCell>
                <CTableHeaderCell>المباع يومياً</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {data.map((row) => (
                <CTableRow key={row.id}>
                  <CTableDataCell>{row.name}</CTableDataCell>
                  <CTableDataCell>
                    <CFormInput value={row.production} onChange={(e) => handleChange(row.id, "production", e.target.value)} />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CFormInput value={row.feed} onChange={(e) => handleChange(row.id, "feed", e.target.value)} />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CFormInput value={row.water} onChange={(e) => handleChange(row.id, "water", e.target.value)} />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CFormInput value={row.vaccination} onChange={(e) => handleChange(row.id, "vaccination", e.target.value)} />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CFormInput value={row.mortality} onChange={(e) => handleChange(row.id, "mortality", e.target.value)} />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CFormInput value={row.sold} onChange={(e) => handleChange(row.id, "sold", e.target.value)} />
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>

          <div className="mt-3 text-end fw-bold">
            إجمالي الإنتاج: {totalProduction} | الكمية المباعة: {totalSold} | الرصيد المتبقي: {remaining}
          </div>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default DataEntry;
