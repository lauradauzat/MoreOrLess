import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { format, subHours, startOfDay, endOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  ArrowsPointingOutIcon, 
  DocumentArrowDownIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface CounterGraphProps {
  actions: Array<{
    type: 'increment' | 'decrement' | 'reset';
    timestamp: { toDate: () => Date };
  }>;
  initialValue: number;
  alertThreshold?: number;
  isFullscreen?: boolean;
  counterId?: string;
}

interface TimeStats {
  peakOccupancy: number;
  averageDaily: number;
  maxEntries15min: number;
  maxExits15min: number;
  peakTime: string;
  peakValue: number;
  lowestTime: string;
  lowestValue: number;
  highestGrowthTime: string;
  highestGrowthRate: number;
  highestDeclineTime: string;
}

interface GraphData {
  time: number;
  occupation: number;
  totalEntries: number;
  totalExits: number;
  entries15min: number;
  exits15min: number;
}

const CounterGraph: React.FC<CounterGraphProps> = ({ 
  actions, 
  initialValue, 
  alertThreshold,
  isFullscreen = false,
  counterId
}) => {
  const router = useRouter();
  const graphRef = useRef<HTMLDivElement>(null);
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');
  const [visibleLines, setVisibleLines] = useState({
    occupation: true,
    totalEntries: true,
    totalExits: true,
    entries15min: true,
    exits15min: true
  });

  const data = useMemo(() => {
    if (!actions.length) return [];

    const sortedActions = [...actions].sort((a, b) => 
      a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime()
    );

    let currentValue = initialValue;
    let totalEntries = 0;
    let totalExits = 0;
    let entries15min = 0;
    let exits15min = 0;
    let lastTime = sortedActions[0].timestamp.toDate();

    const dataPoints = sortedActions.map(action => {
      const currentTime = action.timestamp.toDate();
      
      // Reset 15min counters if more than 15 minutes have passed
      if (currentTime.getTime() - lastTime.getTime() > 15 * 60 * 1000) {
        entries15min = 0;
        exits15min = 0;
        lastTime = currentTime;
      }

      if (action.type === 'increment') {
        currentValue++;
        totalEntries++;
        entries15min++;
      } else if (action.type === 'decrement') {
        currentValue--;
        totalExits++;
        exits15min++;
      } else if (action.type === 'reset') {
        currentValue = 0;
      }

      return {
        time: currentTime.getTime(),
        occupation: currentValue,
        totalEntries,
        totalExits,
        entries15min,
        exits15min
      };
    });

    // Add initial point if needed
    if (dataPoints.length > 0) {
      const firstPoint = dataPoints[0];
      if (firstPoint.occupation !== initialValue) {
        dataPoints.unshift({
          time: subHours(firstPoint.time, 1).getTime(),
          occupation: initialValue,
          totalEntries: 0,
          totalExits: 0,
          entries15min: 0,
          exits15min: 0
        });
      }
    }

    return dataPoints;
  }, [actions, initialValue]);

  const calculateStats = (): TimeStats => {
    if (!data.length) {
      return {
        peakOccupancy: 0,
        averageDaily: 0,
        maxEntries15min: 0,
        maxExits15min: 0,
        peakTime: 'N/A',
        peakValue: 0,
        lowestTime: 'N/A',
        lowestValue: 0,
        highestGrowthTime: 'N/A',
        highestGrowthRate: 0,
        highestDeclineTime: 'N/A'
      };
    }

    let peakOccupancy = initialValue;
    let lowestOccupancy = initialValue;
    let totalOccupancy = 0;
    let count = 0;
    let maxEntries15min = 0;
    let maxExits15min = 0;
    let peakTime = data[0].time;
    let lowestTime = data[0].time;
    let highestGrowthRate = 0;
    let highestGrowthTime = data[0].time;
    let highestDeclineTime = data[0].time;

    data.forEach((point, index) => {
      // Update max 15min values
      maxEntries15min = Math.max(maxEntries15min, point.entries15min);
      maxExits15min = Math.max(maxExits15min, point.exits15min);

      // Update peak and lowest values
      if (point.occupation > peakOccupancy) {
        peakOccupancy = point.occupation;
        peakTime = point.time;
      }
      if (point.occupation < lowestOccupancy) {
        lowestOccupancy = point.occupation;
        lowestTime = point.time;
      }

      totalOccupancy += point.occupation;
      count++;

      // Calculate growth rate
      if (index > 0) {
        const prevValue = data[index - 1].occupation;
        if (prevValue > 0) {
          const growthRate = ((point.occupation - prevValue) / prevValue) * 100;
          if (growthRate > highestGrowthRate) {
            highestGrowthRate = growthRate;
            highestGrowthTime = point.time;
          }
          if (growthRate < -highestGrowthRate) {
            highestDeclineTime = point.time;
          }
        }
      }
    });

    return {
      peakOccupancy,
      averageDaily: Math.round(totalOccupancy / count),
      maxEntries15min,
      maxExits15min,
      peakTime: format(peakTime, 'HH:mm', { locale: fr }),
      peakValue: peakOccupancy,
      lowestTime: format(lowestTime, 'HH:mm', { locale: fr }),
      lowestValue: lowestOccupancy,
      highestGrowthTime: format(highestGrowthTime, 'HH:mm', { locale: fr }),
      highestGrowthRate: Math.round(highestGrowthRate * 10) / 10,
      highestDeclineTime: format(highestDeclineTime, 'HH:mm', { locale: fr })
    };
  };

  const stats = calculateStats();

  const handleStartDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDateTime(e.target.value);
  };

  const handleEndDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDateTime(e.target.value);
  };

  const handleResetDateTime = () => {
    setStartDateTime('');
    setEndDateTime('');
  };

  const toggleLine = (line: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line]
    }));
  };

  const handleFullscreen = () => {
    if (counterId) {
      router.push(`/counter/${counterId}/graph`);
    }
  };

  const handleExportPDF = async () => {
    if (!graphRef.current) return;

    try {
      // Créer un canvas à partir du graphique
      const canvas = await html2canvas(graphRef.current, {
        scale: 2, // Meilleure qualité
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Créer le PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Calculer les dimensions pour centrer le graphique
      const imgWidth = 297; // Largeur A4 en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const x = 0;
      const y = (210 - imgHeight) / 2; // Centrer verticalement

      // Ajouter le graphique au PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imgWidth, imgHeight);

      // Ajouter la date et l'heure
      const now = new Date();
      pdf.setFontSize(10);
      pdf.text(`Exporté le ${format(now, 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 10, 10);

      // Sauvegarder le PDF
      pdf.save(`graphique-${format(now, 'yyyy-MM-dd-HH-mm', { locale: fr })}.pdf`);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
    }
  };

  if (!data.length) {
    return (
      <div className="no-data-message">
        Aucune donnée disponible pour afficher le graphique
      </div>
    );
  }

  const now = new Date();
  const defaultStartTime = subHours(now, 24);
  const startTime = startDateTime ? parseISO(startDateTime) : defaultStartTime;
  const endTime = endDateTime ? parseISO(endDateTime) : now;
  const filteredData = data.filter(point => 
    point.time >= startTime.getTime() && point.time <= endTime.getTime()
  );

  // Ensure we have data points at the start and end of the range
  const extendedData = useMemo(() => {
    if (!filteredData.length) return [];
    
    const result = [...filteredData];
    
    // Add start point if needed
    if (result[0].time > startTime.getTime()) {
      result.unshift({
        ...result[0],
        time: startTime.getTime()
      });
    }
    
    // Add end point if needed
    if (result[result.length - 1].time < now.getTime()) {
      result.push({
        ...result[result.length - 1],
        time: now.getTime()
      });
    }
    
    return result;
  }, [filteredData, startTime, now]);

  return (
    <div className={`graph-wrapper ${isFullscreen ? 'fullscreen' : ''}`} ref={graphRef}>
      <div className="graph-controls">
        <div className="datetime-controls">
          <div className="datetime-group">
            <label htmlFor="start-datetime">Date et heure de début</label>
            <input
              id="start-datetime"
              type="datetime-local"
              value={startDateTime}
              onChange={handleStartDateTimeChange}
              className="datetime-input"
            />
          </div>
          <div className="datetime-group">
            <label htmlFor="end-datetime">Date et heure de fin</label>
            <input
              id="end-datetime"
              type="datetime-local"
              value={endDateTime}
              onChange={handleEndDateTimeChange}
              className="datetime-input"
            />
          </div>
          <button onClick={handleResetDateTime} className="reset-datetime-button">
            <ArrowPathIcon className="button-icon" />
            Réinitialiser
          </button>
          {!isFullscreen && counterId && (
            <button onClick={handleFullscreen} className="fullscreen-button">
              <ArrowsPointingOutIcon className="button-icon" />
              Plein écran
            </button>
          )}
          <button onClick={handleExportPDF} className="export-pdf-button">
            <DocumentArrowDownIcon className="button-icon" />
            Exporter en PDF
          </button>
        </div>
        <div className="legend-controls">
          <div className="legend-header">
            <ChartBarIcon className="legend-icon" />
            <span>Légende</span>
          </div>
          {Object.entries(visibleLines).map(([key, visible]) => (
            <label key={key} className="legend-item">
              <input
                type="checkbox"
                checked={visible}
                onChange={() => toggleLine(key as keyof typeof visibleLines)}
              />
              <span className="legend-label">
                {key === 'occupation' && 'Occupation'}
                {key === 'totalEntries' && 'Entrées totales'}
                {key === 'totalExits' && 'Sorties totales'}
                {key === 'entries15min' && 'Entrées 15min'}
                {key === 'exits15min' && 'Sorties 15min'}
              </span>
            </label>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={isFullscreen ? 600 : 400}>
        <LineChart data={extendedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickFormatter={(time) => format(time, 'HH:mm', { locale: fr })}
            domain={[startTime.getTime(), now.getTime()]}
            type="number"
            scale="time"
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            domain={[0, 'auto']}
            allowDataOverflow={false}
            tickCount={6}
          />
          <Tooltip
            labelFormatter={(time) => format(new Date(time), 'dd MMM HH:mm', { locale: fr })}
            formatter={(value: number, name: string) => {
              const formattedName = 
                name === 'occupation' ? 'Occupation' :
                name === 'totalEntries' ? 'Entrées totales' :
                name === 'totalExits' ? 'Sorties totales' :
                name === 'entries15min' ? 'Entrées 15min' :
                name === 'exits15min' ? 'Sorties 15min' : name;
              return [`${value}`, formattedName];
            }}
          />
          <Legend />
          {visibleLines.occupation && (
            <Line
              type="monotone"
              dataKey="occupation"
              name="Occupation"
              stroke="#4B9CD3"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />
          )}
          {visibleLines.totalEntries && (
            <Line
              type="monotone"
              dataKey="totalEntries"
              name="Entrées totales"
              stroke="#52c41a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />
          )}
          {visibleLines.totalExits && (
            <Line
              type="monotone"
              dataKey="totalExits"
              name="Sorties totales"
              stroke="#f5222d"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />
          )}
          {visibleLines.entries15min && (
            <Line
              type="monotone"
              dataKey="entries15min"
              name="Entrées 15min"
              stroke="#722ed1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />
          )}
          {visibleLines.exits15min && (
            <Line
              type="monotone"
              dataKey="exits15min"
              name="Sorties 15min"
              stroke="#fa8c16"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />
          )}
          {alertThreshold && (
            <ReferenceLine
              y={alertThreshold}
              stroke="red"
              strokeDasharray="3 3"
              label={{
                value: `Seuil d'alerte (${alertThreshold})`,
                position: 'right',
                fill: 'red'
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="stats-panel">
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">Pic d'occupation</span>
            <span className="stat-value">{stats.peakOccupancy}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Moyenne journalière</span>
            <span className="stat-value">{stats.averageDaily}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max entrées/15min</span>
            <span className="stat-value">{stats.maxEntries15min}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max sorties/15min</span>
            <span className="stat-value">{stats.maxExits15min}</span>
          </div>
        </div>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">Période de plus forte affluence</span>
            <span className="stat-value">{stats.peakTime}</span>
            <span className="stat-subvalue">{stats.peakValue} personnes</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Période de plus faible affluence</span>
            <span className="stat-value">{stats.lowestTime}</span>
            <span className="stat-subvalue">{stats.lowestValue} personnes</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Plus forte croissance</span>
            <span className="stat-value">{stats.highestGrowthTime}</span>
            <span className="stat-subvalue">+{stats.highestGrowthRate}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Plus forte décroissance</span>
            <span className="stat-value">{stats.highestDeclineTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterGraph; 