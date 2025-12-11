// src/views/dashboard/BroilerDashboard.js
import React, { useState, useEffect } from "react";
import { CCard, CCardBody, CCardHeader, CRow, CCol } from "@coreui/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import useAuth from '../../auth/useAuth';

const sampleData = [
  { week: 1, weight: 0.5, fcr: 1.5 },
  { week: 2, weight: 1.2, fcr: 1.6 },
  { week: 3, weight: 2.0, fcr: 1.7 },
];

const BroilerDashboard = () => {
  const { checkTokenValidity } = useAuth();

  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  const [totalBirds, setTotalBirds] = useState(500);
  const [readyForSlaughter, setReadyForSlaughter] = useState(120);
  const [avgWeight, setAvgWeight] = useState(1.5);

  return (
    <div dir="rtl">
      <CRow className="mb-4">
        <CCol md={4}>
          <CCard className="text-center">
            <CCardHeader>إجمالي الطيور</CCardHeader>
            <CCardBody>{totalBirds} طائر</CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="text-center">
            <CCardHeader>الطيور الجاهزة للذبح</CCardHeader>
            <CCardBody>{readyForSlaughter} طائر</CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="text-center">
            <CCardHeader>متوسط الوزن الأسبوعي (كجم)</CCardHeader>
            <CCardBody>{avgWeight} كجم</CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader>تطور الوزن الأسبوعي و FCR</CCardHeader>
        <CCardBody style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" label={{ value: "الأسبوع", position: "insideBottomRight" }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="#52d7c6" name="الوزن" />
              <Line type="monotone" dataKey="fcr" stroke="#004952" name="FCR" />
            </LineChart>
          </ResponsiveContainer>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default BroilerDashboard;
