import dynamic from 'next/dynamic'

const LineGraph = dynamic(import ('./LineGraph'), {
  ssr: false
})

const Chart = (
  { 
    parentData, 
    type, 
    parentSize, 
    isPrefix, 
    units, 
    label,
    xAxis,
    yAxis
  }
) => {

  return (
    <div>
        {type === 'line' &&
          <LineGraph
            id={label + '-line-graph'}
            parentSize={parentSize}
            data={parentData}
            label={label}
            units={units}
            isPrefix={isPrefix}
            yAxis={yAxis}
            xAxis={xAxis}
          />
        }
        {type === 'stacked-area' &&
          <LineGraph 
            id={label + '-stacked-area-graph'}
            parentSize={parentSize}
            data={parentData}
            label={label}
            units={units}
            isPrefix={isPrefix}
            yAxis={yAxis}
            xAxis={xAxis}
            stacked={true}
          />
        }
    </div>
  );
};

export default Chart;
