import React from 'react'
import SiteSettings from './pages/SiteSettings'
import LayerDashboard from './views/dashboard/LayerDashboard'
import PrivateRoute from './auth/PrivateRoute'
import BatimentsDisplay from './views/BatimentsDisplay'
import Miseplaces from './pages/Misesplaces.jsx'

// Dashboard

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard.jsx'))
const Colors = React.lazy(() => import('./views/theme/colors/Colors.jsx'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography.jsx'))


import BroilerDashboard from './views/dashboard/BroilerDashboard.jsx'
import DataEntry from './pages/DataEntry.jsx'
import Reports from './pages/Reports.jsx'
import ReportExportPage from './pages/ReportExportPage.jsx'
import StockEntry from './pages/StockEntry'
import BonEntreeConsultation from './pages/BonEntreeConsultation'



// // Base
// const Accordion = React.lazy(() => import('./views/base/accordion/Accordion.jsx'))
// const Breadcrumbs = React.lazy(() => import('./views/base/breadcrumbs/Breadcrumbs.jsx'))
// const Cards = React.lazy(() => import('./views/base/cards/Cards.jsx'))
// const Carousels = React.lazy(() => import('./views/base/carousels/Carousels.jsx'))
// const Collapses = React.lazy(() => import('./views/base/collapses/Collapses.jsx'))
// const ListGroups = React.lazy(() => import('./views/base/list-groups/ListGroups.jsx'))
// const Navs = React.lazy(() => import('./views/base/navs/Navs.jsx'))
// const Paginations = React.lazy(() => import('./views/base/paginations/Paginations.jsx'))
// const Placeholders = React.lazy(() => import('./views/base/placeholders/Placeholders.jsx'))
// const Popovers = React.lazy(() => import('./views/base/popovers/Popovers.jsx'))
// const Progress = React.lazy(() => import('./views/base/progress/Progress.jsx'))
// const Spinners = React.lazy(() => import('./views/base/spinners/Spinners.jsx'))
// const Tabs = React.lazy(() => import('./views/base/tabs/Tabs.jsx'))
// const Tables = React.lazy(() => import('./views/base/tables/Tables.jsx'))
// const Tooltips = React.lazy(() => import('./views/base/tooltips/Tooltips.jsx'))

// // Buttons
// const Buttons = React.lazy(() => import('./views/buttons/buttons/Buttons.jsx'))
// const ButtonGroups = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups.jsx'))
// const Dropdowns = React.lazy(() => import('./views/buttons/dropdowns/Dropdowns.jsx'))

//Forms
// const ChecksRadios = React.lazy(() => import('./views/forms/checks-radios/ChecksRadios.jsx'))
// const FloatingLabels = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels.jsx'))
// const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl.jsx'))
// const InputGroup = React.lazy(() => import('./views/forms/input-group/InputGroup.jsx'))
// const Layout = React.lazy(() => import('./views/forms/layout/Layout.jsx'))
// const Range = React.lazy(() => import('./views/forms/range/Range.jsx'))
// const Select = React.lazy(() => import('./views/forms/select/Select.jsx'))
// const Validation = React.lazy(() => import('./views/forms/validation/Validation.jsx'))

// const Charts = React.lazy(() => import('./views/charts/Charts.jsx'))

// Icons
// const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons.jsx'))
// const Flags = React.lazy(() => import('./views/icons/flags/Flags.jsx'))
// const Brands = React.lazy(() => import('./views/icons/brands/Brands.jsx'))

// // Notifications
// const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts.jsx'))
// const Badges = React.lazy(() => import('./views/notifications/badges/Badges.jsx'))
// const Modals = React.lazy(() => import('./views/notifications/modals/Modals.jsx'))
// const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts.jsx'))


const routes = [
  { path: '/', exact: true, name: 'Home', element: <PrivateRoute><Miseplaces /></PrivateRoute> },
  { path: '/dashboard', exact: true, name: 'لوحة التحكم' ,element: <PrivateRoute><Dashboard /></PrivateRoute> },
  { path: '/dashboard/broiler', name: 'لوحة التسمين', element: <PrivateRoute><BroilerDashboard /></PrivateRoute> },
  { path: '/dashboard/layer', name: 'لوحة البياض', element: <PrivateRoute><LayerDashboard /></PrivateRoute> },
  { path: '/data-entry', name: 'إدخال البيانات اليومية', element: <PrivateRoute><DataEntry /></PrivateRoute> },
  { path: '/reports', name: 'التقارير', element: <PrivateRoute><Reports /></PrivateRoute> },
   { path: '/report-export', name: 'تصدير التقارير', element: <PrivateRoute><ReportExportPage /></PrivateRoute> },
 { path: '/settings', name: 'مصادقة النشاط اليومي', element: <PrivateRoute><SiteSettings /></PrivateRoute> },
   { path: '/batiments', name: 'قائمة المباني', element: <PrivateRoute><BatimentsDisplay /></PrivateRoute> },
   { path: '/centres', name: 'قائمة الحظائر', element: <PrivateRoute><Miseplaces /></PrivateRoute> },
   { path: '/stock-entry', name: 'إضافة استقبال المنتوجات', element: <PrivateRoute><StockEntry /></PrivateRoute> },
   { path: '/bon-entree-consultation', name: 'قائمة استقبال المنتوجات', element: <PrivateRoute><BonEntreeConsultation /></PrivateRoute> },


//   { path: '/theme', name: 'Theme', element: <PrivateRoute><Colors /></PrivateRoute>, exact: true },
//   { path: '/theme/colors', name: 'Colors', element: <PrivateRoute><Colors /></PrivateRoute> },
//   { path: '/theme/typography', name: 'Typography', element: <PrivateRoute><Typography /></PrivateRoute> },
//   { path: '/base', name: 'Base', element: <PrivateRoute><Cards /></PrivateRoute>, exact: true },
//   { path: '/base/accordion', name: 'Accordion', element: <PrivateRoute><Accordion /></PrivateRoute> },
//   { path: '/base/breadcrumbs', name: 'Breadcrumbs', element: <PrivateRoute><Breadcrumbs /></PrivateRoute> },
//   { path: '/base/cards', name: 'Cards', element: <PrivateRoute><Cards /></PrivateRoute> },
//   { path: '/base/carousels', name: 'Carousel', element: <PrivateRoute><Carousels /></PrivateRoute> },
//   { path: '/base/collapses', name: 'Collapse', element: <PrivateRoute><Collapses /></PrivateRoute> },
//   { path: '/base/list-groups', name: 'List Groups', element: <PrivateRoute><ListGroups /></PrivateRoute> },
//   { path: '/base/navs', name: 'Navs', element: <PrivateRoute><Navs /></PrivateRoute> },
//   { path: '/base/paginations', name: 'Paginations', element: <PrivateRoute><Paginations /></PrivateRoute> },
//   { path: '/base/placeholders', name: 'Placeholders', element: <PrivateRoute><Placeholders /></PrivateRoute> },
//   { path: '/base/popovers', name: 'Popovers', element: <PrivateRoute><Popovers /></PrivateRoute> },
//   { path: '/base/progress', name: 'Progress', element: <PrivateRoute><Progress /></PrivateRoute> },
//   { path: '/base/spinners', name: 'Spinners', element: <PrivateRoute><Spinners /></PrivateRoute> },
//   { path: '/base/tabs', name: 'Tabs', element: <PrivateRoute><Tabs /></PrivateRoute> },
//   { path: '/base/tables', name: 'Tables', element: <PrivateRoute><Tables /></PrivateRoute> },
//   { path: '/base/tooltips', name: 'Tooltips', element: <PrivateRoute><Tooltips /></PrivateRoute> },
//   { path: '/buttons', name: 'Buttons', element: <PrivateRoute><Buttons /></PrivateRoute>, exact: true },
//   { path: '/buttons/buttons', name: 'Buttons', element: <PrivateRoute><Buttons /></PrivateRoute> },
//   { path: '/buttons/dropdowns', name: 'Dropdowns', element: <PrivateRoute><Dropdowns /></PrivateRoute> },
//   { path: '/buttons/button-groups', name: 'Button Groups', element: <PrivateRoute><ButtonGroups /></PrivateRoute> },
//   { path: '/charts', name: 'Charts', element: <PrivateRoute><Charts /></PrivateRoute> },
//   { path: '/forms', name: 'Forms', element: <PrivateRoute><FormControl /></PrivateRoute>, exact: true },
//   { path: '/forms/form-control', name: 'Form Control', element: <PrivateRoute><FormControl /></PrivateRoute> },
//   { path: '/forms/select', name: 'Select', element: <PrivateRoute><Select /></PrivateRoute> },
//   { path: '/forms/checks-radios', name: 'Checks & Radios', element: <PrivateRoute><ChecksRadios /></PrivateRoute> },
//   { path: '/forms/range', name: 'Range', element: <PrivateRoute><Range /></PrivateRoute> },
//   { path: '/forms/input-group', name: 'Input Group', element: <PrivateRoute><InputGroup /></PrivateRoute> },
//   { path: '/forms/floating-labels', name: 'Floating Labels', element: <PrivateRoute><FloatingLabels /></PrivateRoute> },
//   { path: '/forms/layout', name: 'Layout', element: <PrivateRoute><Layout /></PrivateRoute> },
//   { path: '/forms/validation', name: 'Validation', element: <PrivateRoute><Validation /></PrivateRoute> },
//   { path: '/icons', exact: true, name: 'Icons', element: <PrivateRoute><CoreUIIcons /></PrivateRoute> },
//   { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: <PrivateRoute><CoreUIIcons /></PrivateRoute> },
//   { path: '/icons/flags', name: 'Flags', element: <PrivateRoute><Flags /></PrivateRoute> },
//   { path: '/icons/brands', name: 'Brands', element: <PrivateRoute><Brands /></PrivateRoute> },
//   { path: '/notifications', name: 'Notifications', element: <PrivateRoute><Alerts /></PrivateRoute>, exact: true },
//   { path: '/notifications/alerts', name: 'Alerts', element: <PrivateRoute><Alerts /></PrivateRoute> },
//   { path: '/notifications/badges', name: 'Badges', element: <PrivateRoute><Badges /></PrivateRoute> },
//   { path: '/notifications/modals', name: 'Modals', element: <PrivateRoute><Modals /></PrivateRoute> },
//   { path: '/notifications/toasts', name: 'Toasts', element: <PrivateRoute><Toasts /></PrivateRoute> },


]

export default routes
