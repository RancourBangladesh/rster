"use client";
import { useState, useMemo } from 'react';

interface Props {
  headers: string[];
  schedule: string[];
  selectedDate?: string;
  onSelect?: (date: string, shift: string) => void;
}

const MONTH_MAP: Record<string, number> = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11
};
const MONTH_NAME: Record<number,string> = {
  0:"Jan",1:"Feb",2:"Mar",3:"Apr",4:"May",5:"Jun",6:"Jul",7:"Aug",8:"Sep",9:"Oct",10:"Nov",11:"Dec"
};
const MONTH_NAME_FULL: Record<number,string> = {
  0:"January",1:"February",2:"March",3:"April",4:"May",5:"June",6:"July",7:"August",8:"September",9:"October",10:"November",11:"December"
};

function detectMonth(headers: string[]): {monthIndex:number, name:string}|null {
  for (const h of headers) {
    const m = h.match(/[A-Za-z]+$/);
    if (m) {
      const monthStr = m[0].toLowerCase().slice(0,3);
      if (MONTH_MAP[monthStr] !== undefined) {
        const idx = MONTH_MAP[monthStr];
        return {monthIndex: idx, name: MONTH_NAME[idx]};
      }
    }
  }
  return null;
}

function detectAvailableMonths(headers: string[]): Set<string> {
  const s = new Set<string>();
  headers.forEach(h=>{
    const m = h.match(/[A-Za-z]+$/);
    if (m) s.add(m[0].slice(0,3).toLowerCase());
  });
  return s;
}

export default function MiniScheduleCalendar({ headers, schedule, selectedDate, onSelect }: Props) {
  const [monthOffset, setMonthOffset] = useState(0);

  const { weeks, monthName, year, canGoPrev, canGoNext } = useMemo(()=>{
    const det = detectMonth(headers);
    const availableMonths = detectAvailableMonths(headers);
    const now = new Date();
    let year = now.getFullYear();
    let monthIndex = det ? det.monthIndex : now.getMonth();
    monthIndex += monthOffset;
    while (monthIndex < 0) { monthIndex += 12; year -= 1; }
    while (monthIndex > 11) { monthIndex -= 12; year += 1; }

    const monthName = MONTH_NAME_FULL[monthIndex];
    const lastDay = new Date(year, monthIndex+1, 0).getDate();
    const days = Array.from({length:lastDay}, (_,i)=> i+1);

    interface DayCell {
      label: string;
      headerKey: string;
      day: number;
      weekday: number;
      shift: string;
      hasShift: boolean;
    }

    const dayCells: DayCell[] = days.map(day=>{
      const headerKey = `${day}${MONTH_NAME[monthIndex]}`;
      const d = new Date(year, monthIndex, day);
      const idx = headers.indexOf(headerKey);
      const shift = idx >= 0 ? (schedule[idx] || '') : '';
      return {
        label: String(day),
        headerKey,
        day,
        weekday: d.getDay(),
        shift,
        hasShift: headers.includes(headerKey)
      };
    });

    const weeks: (DayCell|null)[][] = [];
    let currentWeek: (DayCell|null)[] = [];
    const firstWeekday = dayCells[0]?.weekday ?? 0;
    for (let i=0;i<firstWeekday;i++) currentWeek.push(null);
    dayCells.forEach(cell=>{
      currentWeek.push(cell);
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    });
    if (currentWeek.length>0) { while (currentWeek.length<7) currentWeek.push(null); weeks.push(currentWeek); }

    const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
    const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
    const prevMonthKey = MONTH_NAME[prevMonthIndex].toLowerCase().slice(0, 3);
    const nextMonthKey = MONTH_NAME[nextMonthIndex].toLowerCase().slice(0, 3);
    const canGoPrev = availableMonths.has(prevMonthKey);
    const canGoNext = availableMonths.has(nextMonthKey);

    return { weeks: weeks as (DayCell|null)[][], monthName, year, canGoPrev, canGoNext };
  },[headers, schedule, monthOffset]);

  const handleSelect = (cell: {headerKey: string, shift: string}) => {
    if (onSelect) onSelect(cell.headerKey, cell.shift);
  };

  const getShiftClass = (shift: string) => {
    if (!shift) return '';
    if (shift === 'DO') return 'day-off';
    if (['SL', 'CL', 'EL', 'HL'].includes(shift)) return 'leave';
    return 'working';
  };

  return (
    <div className="mini-schedule-calendar">
      <div className="calendar-header">
        <button 
          type="button" 
          className="nav-btn" 
          onClick={() => setMonthOffset(monthOffset - 1)} 
          disabled={!canGoPrev}
          title="Previous Month"
        >
          ←
        </button>
        <div className="month-title">{monthName.toUpperCase()} {year}</div>
        <button 
          type="button" 
          className="nav-btn" 
          onClick={() => setMonthOffset(monthOffset + 1)} 
          disabled={!canGoNext}
          title="Next Month"
        >
          →
        </button>
      </div>

      <div className="weekdays">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>(
          <div key={d} className="weekday">{d}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {weeks.map((week,wi)=>(
          <div className="week-row" key={wi}>
            {week.map((cell,ci)=>{
              if (!cell) return <div key={ci} className="day-cell empty" />;
              const isActive = cell.hasShift;
              const isSelected = cell.headerKey === selectedDate;
              const shiftClass = getShiftClass(cell.shift);
              return (
                <button
                  key={ci}
                  type="button"
                  className={`day-cell ${isActive?'active':''} ${isSelected?'selected':''} ${shiftClass}`}
                  onClick={()=> isActive && handleSelect(cell)}
                  disabled={!isActive}
                  title={`${cell.headerKey} - ${cell.shift || 'N/A'}`}
                >
                  <span className="day-number">{cell.label}</span>
                  {cell.shift && <span className="day-shift">{cell.shift}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-dot working"></span>
          <span>Working</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot day-off"></span>
          <span>Day Off</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot leave"></span>
          <span>Leave</span>
        </div>
      </div>

      <style jsx>{`
        .mini-schedule-calendar {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          width: 100%;
          box-sizing: border-box;
        }
        
        .calendar-header {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .month-title {
          font-size: 14px;
          letter-spacing: 1px;
          font-weight: 600;
          color: #111827;
        }
        
        .nav-btn {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          color: #6b7280;
          padding: 6px 12px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
        }
        
        .nav-btn:hover:not(:disabled) {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }
        
        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          margin-bottom: 8px;
        }
        
        .weekday {
          text-align: center;
          font-size: 12px;
          letter-spacing: 0.5px;
          color: #6b7280;
          padding: 4px 0;
          font-weight: 500;
        }
        
        .calendar-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        
        .week-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        
        .day-cell {
          position: relative;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          min-height: 52px;
          padding: 6px 4px;
          font-size: 13px;
          color: #9ca3af;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .day-cell.active {
          color: #374151;
          background: #fff;
        }
        
        .day-cell:hover.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }
        
        .day-cell.selected {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
          font-weight: 700;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
        }
        
        .day-cell.working {
          background: #d1fae5;
          border-color: #6ee7b7;
          color: #065f46;
        }
        
        .day-cell.day-off {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #991b1b;
        }
        
        .day-cell.leave {
          background: #e0e7ff;
          border-color: #a5b4fc;
          color: #3730a3;
        }
        
        .day-cell.selected.working,
        .day-cell.selected.day-off,
        .day-cell.selected.leave {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }
        
        .day-cell.empty {
          background: transparent;
          border: none;
          cursor: default;
        }
        
        .day-cell:disabled {
          opacity: 0.3;
          cursor: default;
        }
        
        .day-number {
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
        }
        
        .day-shift {
          font-size: 11px;
          font-weight: 500;
          margin-top: 2px;
          opacity: 0.9;
        }
        
        .legend {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }
        
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          border: 1px solid;
        }
        
        .legend-dot.working {
          background: #d1fae5;
          border-color: #6ee7b7;
        }
        
        .legend-dot.day-off {
          background: #fee2e2;
          border-color: #fca5a5;
        }
        
        .legend-dot.leave {
          background: #e0e7ff;
          border-color: #a5b4fc;
        }
      `}</style>
    </div>
  );
}
