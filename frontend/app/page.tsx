"use client";
import React, {useEffect, useMemo, useState} from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import dynamic from "next/dynamic";
import {supabase} from "@/lib/supabase";

const MapComponent = dynamic(() => import('../components/Maps'), {
    ssr: false,
    loading: () => (
        <div style={{
            height: '500px',
            background: '#f1f5f9',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#64748b'
        }}>
            Initializing Map...
        </div>
    )
});

interface Stat {
    race: string;
    count: number;
    percentage: number;

    [key: string]: string | number;
}

const raceNames: { [key: string]: string } = {
    'W': 'White', 'B': 'Black', 'H': 'Hispanic', 'B;H': 'Multiracial',
    'A': 'Asian', 'N': 'Native American', 'O': 'Other', 'None': 'Unknown', 'Unknown': 'Unknown'
};

const RACE_COLORS: { [key: string]: string } = {
    'White': '#3b82f6', 'Black': '#1f2937', 'Hispanic': '#f97316',
    'Asian': '#10b981', 'Native American': '#eab308', 'Multiracial': '#8b5cf6',
    'Other': '#ef4444', 'Unknown': '#94a3b8'
};

const US_STATES_MAP: { [key: string]: string } = {
    "All": "All States",
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
};

export default function Dashboard() {
    const [data, setData] = useState<Stat[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [selectedState, setSelectedState] = useState("All");
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const rowsPerPage = 10;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            let query = supabase
                .from('incidents')
                .select('*')
                .range(0, 20000);
            if (selectedState !== "All") {
                query = query.eq('state', selectedState);
            }
            const {data: supabaseData, error} = await query;
            if (!error && supabaseData) {
                const statsMap: { [key: string]: number } = {};
                supabaseData.forEach(item => {
                    const r = item.race || 'Unknown';
                    statsMap[r] = (statsMap[r] || 0) + 1;
                });
                const total = supabaseData.length;
                const formattedStats = Object.keys(statsMap).map(r => ({
                    race: raceNames[r] || "Unknown",
                    count: statsMap[r],
                    percentage: (statsMap[r] / total) * 100
                }));

                setData(formattedStats);
                setIncidents(supabaseData);
            }
            setLoading(false);
        }

        fetchData();
    }, [selectedState]);

    const formatSmartPercent = (value: number) => {
        if (value > 0 && value < 0.1) return value.toFixed(2);
        return parseFloat(value.toFixed(1));
    };

    const exportToCSV = () => {
        const headers = ["Name", "City", "State", "Armed Status", "Body Camera"];
        const rows = filteredAndSorted.map(item => [
            `"${item.name || 'UNKNOWN'}"`,
            `"${item.city || 'RURAL'}"`,
            `"${item.state || selectedState}"`,
            `"${item.armed_with || 'UNKNOWN'}"`,
            item.body_camera ? "ON" : "OFF"
        ]);
        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `incidents_${selectedState.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({key, direction});
    };

    const filteredAndSorted = useMemo(() => {
        let items = [...incidents].filter(item =>
            String(item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(item.city || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (sortConfig) {
            items.sort((a, b) => {
                const aV = a[sortConfig.key] ?? "";
                const bV = b[sortConfig.key] ?? "";
                return sortConfig.direction === 'asc' ? (aV < bV ? -1 : 1) : (aV > bV ? -1 : 1);
            });
        }
        return items;
    }, [incidents, searchTerm, sortConfig]);

    const totalPages = Math.ceil(filteredAndSorted.length / rowsPerPage);
    const currentRows = filteredAndSorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <div style={{
            padding: '20px',
            backgroundColor: '#f8fafc',
            minHeight: '100vh',
            color: '#1e293b',
            fontFamily: 'sans-serif'
        }}>
            <style>{`
                .dashboard-container { max-width: 1200px; margin: 0 auto; }
                .card { background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 24px; }
                .btn-state { padding: 6px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 10px; font-weight: 700; cursor: pointer; background: white; transition: 0.2s; }
                .btn-state.active { background: #3b82f6; color: white; border-color: #3b82f6; }
                .badge { padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
            `}</style>

            <div className="dashboard-container">
                <header style={{marginBottom: '30px'}}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        letterSpacing: '-0.025em',
                        marginBottom: '8px'
                    }}>
                        Fatal Police Shooting
                    </h1>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        borderLeft: '4px solid #3b82f6',
                        paddingLeft: '15px'
                    }}>
                        <p style={{
                            color: '#64748b',
                            fontSize: '16px',
                            fontWeight: 500,
                            margin: 0
                        }}>
                            Interactive US Data Explorer
                        </p>
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '13px',
                            margin: 0
                        }}>
                            Data Source: <a href="https://github.com/washingtonpost/data-police-shootings"
                                            target="_blank" rel="noopener noreferrer"
                                            style={{color: '#3b82f6', textDecoration: 'none', fontWeight: 600}}>The
                            Washington Post (via GitHub)</a> (2015 - Present)
                        </p>
                    </div>
                </header>

                <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px'}}>
                    <div className="card" style={{background: '#0f172a', color: 'white', textAlign: 'center'}}>
                        <span style={{
                            color: '#3b82f6',
                            fontWeight: 800,
                            fontSize: '12px'
                        }}>{US_STATES_MAP[selectedState]}</span>
                        <div style={{
                            fontSize: '3.5rem',
                            fontWeight: 800,
                            margin: '10px 0'
                        }}>{filteredAndSorted.length.toLocaleString()}</div>
                        <span style={{color: '#94a3b8', fontSize: '12px'}}>RECORDS FOUND</span>
                    </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                    <div style={{marginBottom: '10px', display: 'flex', justifyContent: 'space-between'}}>
                        <span
                            style={{fontWeight: 800, fontSize: '11px', color: '#64748b'}}>GEOGRAPHIC DISTRIBUTION</span>
                        <span style={{fontSize: '11px', color: '#3b82f6', fontWeight: 700}}>LIVE FROM SUPABASE</span>
                    </div>
                    <MapComponent incidents={filteredAndSorted}/>
                </div>

                <div className="card" style={{marginBottom: '20px'}}>
                    <div style={{marginBottom: '10px', display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontWeight: 800, fontSize: '11px', color: '#64748b'}}>FILTER BY STATE</span>
                        <button onClick={() => setSelectedState("All")} style={{
                            fontSize: '11px',
                            border: 'none',
                            background: 'none',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            fontWeight: 700
                        }}>RESET
                        </button>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
                        gap: '4px'
                    }}>
                        {Object.keys(US_STATES_MAP).filter(k => k !== "All").map(code => (
                            <button key={code} onClick={() => setSelectedState(code)}
                                    className={`btn-state ${selectedState === code ? 'active' : ''}`}>{code}</button>
                        ))}
                    </div>
                </div>

                {loading ? <div style={{textAlign: 'center', padding: '100px', fontWeight: 700}}>Refreshing
                    Database...</div> : (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                            gap: '20px',
                            marginBottom: '20px'
                        }}>
                            <div className="card">
                                <h3 style={{fontSize: '13px', fontWeight: 800, marginBottom: '20px'}}>INCIDENTS BY
                                    RACE</h3>
                                <div style={{height: 350}}>
                                    <ResponsiveContainer>
                                        <BarChart data={data} margin={{top: 30, right: 30, left: 0, bottom: 20}}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                            <XAxis dataKey="race" axisLine={false} tickLine={false}
                                                   tick={{fontSize: 10, fill: '#64748b'}}/>
                                            <YAxis axisLine={false} tickLine={false}
                                                   tick={{fontSize: 10, fill: '#64748b'}}/>
                                            <Tooltip cursor={{fill: '#f8fafc'}}/>
                                            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={35}>
                                                {data.map((entry, index) => <Cell key={index}
                                                                                  fill={RACE_COLORS[entry.race] || '#94a3b8'}/>)}
                                                <LabelList dataKey="count" position="top" style={{
                                                    fill: '#475569',
                                                    fontSize: '11px',
                                                    fontWeight: 700
                                                }}/>
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="card">
                                <h3 style={{fontSize: '13px', fontWeight: 800, marginBottom: '20px'}}>DISTRIBUTION</h3>
                                <div style={{height: 350}}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={data} innerRadius={70} outerRadius={100} dataKey="count"
                                                 nameKey="race" stroke="none" paddingAngle={5}>
                                                {data.map((entry, index) => <Cell key={index}
                                                                                  fill={RACE_COLORS[entry.race] || '#94a3b8'}/>)}
                                            </Pie>
                                            <Tooltip formatter={(value: any, name: any) => {
                                                const total = data.reduce((acc, curr) => acc + curr.count, 0);
                                                const p = total > 0 ? (Number(value) / total) * 100 : 0;
                                                return [`${value} cases (${formatSmartPercent(p)}%)`, String(name)];
                                            }}/>
                                            <Legend verticalAlign="bottom" align="center"
                                                    formatter={(value, entry: any) => {
                                                        const total = data.reduce((acc, curr) => acc + curr.count, 0);
                                                        const val = entry.payload.count;
                                                        const p = total > 0 ? (val / total) * 100 : 0;
                                                        return <span style={{
                                                            color: '#475569',
                                                            fontSize: '11px',
                                                            fontWeight: 600
                                                        }}>{value} ({formatSmartPercent(p)}%)</span>;
                                                    }}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
                            <div style={{
                                padding: '20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #f1f5f9',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                <h3 style={{fontSize: '13px', fontWeight: 800, margin: 0}}>DETAILED RECORDS</h3>
                                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                    <button onClick={exportToCSV} style={{
                                        padding: '8px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #10b981',
                                        backgroundColor: '#f0fdf4',
                                        color: '#166534',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}>📥 EXPORT CSV
                                    </button>
                                    <input type="text" placeholder="Search name or city..." value={searchTerm}
                                           onChange={(e) => setSearchTerm(e.target.value)} style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '12px',
                                        outline: 'none'
                                    }}/>
                                    <div style={{
                                        display: 'flex',
                                        background: '#f1f5f9',
                                        borderRadius: '8px',
                                        padding: '2px'
                                    }}>
                                        <button className="btn-state" style={{border: 'none'}}
                                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                                disabled={currentPage === 1}>PREV
                                        </button>
                                        <span style={{
                                            padding: '0 10px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            alignSelf: 'center'
                                        }}>{currentPage}/{totalPages || 1}</span>
                                        <button className="btn-state" style={{border: 'none'}}
                                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                                disabled={currentPage === totalPages || totalPages === 0}>NEXT
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div style={{overflowX: 'auto'}}>
                                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px'}}>
                                    <thead>
                                    <tr style={{textAlign: 'left', backgroundColor: '#f8fafc'}}>
                                        <th onClick={() => requestSort('name')}
                                            style={{padding: '15px 20px', cursor: 'pointer'}}>NAME ↑↓
                                        </th>
                                        <th style={{padding: '15px'}}>CITY</th>
                                        <th style={{padding: '15px'}}>ARMED</th>
                                        <th style={{padding: '15px', textAlign: 'center'}}>BODY CAM</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {currentRows.length > 0 ? (
                                        currentRows.map((item, i) => (
                                            <tr key={i} style={{borderBottom: '1px solid #f1f5f9'}}>
                                                <td style={{
                                                    padding: '15px 20px',
                                                    fontWeight: 700
                                                }}>{item.name || 'UNKNOWN'}</td>
                                                <td style={{padding: '15px'}}>{item.city}</td>
                                                <td style={{padding: '15px'}}>
                                                    <span className="badge" style={{
                                                        backgroundColor: item.armed_with?.toLowerCase() === 'unarmed' ? '#dcfce7' : '#fee2e2',
                                                        color: item.armed_with?.toLowerCase() === 'unarmed' ? '#166534' : '#991b1b'
                                                    }}>{item.armed_with}</span>
                                                </td>
                                                <td style={{
                                                    padding: '15px',
                                                    textAlign: 'center',
                                                    fontWeight: 800,
                                                    color: item.body_camera ? '#3b82f6' : '#ef4444'
                                                }}>{item.body_camera ? 'ON' : 'OFF'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{padding: '60px 20px', textAlign: 'center'}}>
                                                <div style={{fontSize: '24px', marginBottom: '10px'}}>🔍</div>
                                                <div style={{fontWeight: 700, color: '#64748b'}}>No records found</div>
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div id="about-section" className="card"
                             style={{marginTop: '40px', backgroundColor: '#f1f5f9', border: 'none'}}>
                            <h2 style={{fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px'}}>About this
                                Project</h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '30px',
                                fontSize: '13px',
                                color: '#475569'
                            }}>
                                <div>
                                    <h4 style={{color: '#0f172a', marginBottom: '8px'}}>The Data Source</h4>
                                    <p>Sourced from <strong>The Washington Post</strong> database, tracking fatal
                                        shootings by officers since 2015.</p>
                                </div>
                                <div>
                                    <h4 style={{color: '#0f172a', marginBottom: '8px'}}>Why This Matters</h4>
                                    <p>Provides transparency and data-driven insights into law enforcement
                                        interventions.</p>
                                </div>
                            </div>
                            <div style={{
                                marginTop: '20px',
                                padding: '15px',
                                backgroundColor: '#fff7ed',
                                borderRadius: '12px',
                                border: '1px solid #ffedd5'
                            }}>
                                <h4 style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    color: '#9a3412',
                                    marginBottom: '5px'
                                }}>⚠️ DISCLAIMER</h4>
                                <p style={{fontSize: '11px', color: '#7c2d12', margin: 0}}>This dashboard is for
                                    educational purposes. Data is provided "as is". The developer is NOT affiliated with
                                    The Washington Post.</p>
                            </div>
                        </div>

                        <footer style={{
                            marginTop: '50px',
                            padding: '30px 0',
                            borderTop: '1px solid #e2e8f0',
                            textAlign: 'center',
                            color: '#64748b',
                            fontSize: '14px'
                        }}>
                            <div style={{marginBottom: '10px'}}>
                                Designed and Developed by <strong>Luca Daniel Ionescu</strong>
                            </div>

                            <div style={{marginBottom: '10px'}}>
                                <a href="https://github.com/lucadani7/FatalPoliceShooting" target="_blank"
                                   style={{color: '#3b82f6', textDecoration: 'none'}}>Source Code</a>
                                <span style={{margin: '0 10px', color: '#cbd5e1'}}>|</span>
                                <a href="https://github.com/lucadani7" target="_blank"
                                   style={{color: '#3b82f6', textDecoration: 'none'}}>GitHub Profile</a>
                            </div>

                            <div style={{fontSize: '12px', color: '#94a3b8'}}>
                                © 2026 Fatal Police Shooting Project | Inspired by
                                <a href="http://nifty.stanford.edu/2023/lynn-fatal-police-shootings/" target="_blank"
                                   style={{color: '#94a3b8', textDecoration: 'underline', marginLeft: '4px'}}>
                                    Stanford Nifty Assignments
                                </a>
                            </div>
                        </footer>
                    </>
                )}
            </div>
        </div>
    );
}