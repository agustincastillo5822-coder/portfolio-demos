import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Panel de solicitudes | Demo',description:'Demo original de filtros y estados con datos ficticios.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
