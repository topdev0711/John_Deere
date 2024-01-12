import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Plot = dynamic(import ('./ReactPlotly'), {
  ssr: false
});

const colors = [
  '#367c2b',
  '#ffb000',
  '#a3ae58',
  '#ffde00',
  '#bab994',
  '#ffde00',
  '#ffb000',
];

function getHoverText(isPrefix, units, term) {
  const label = term ? `<i>${term}</i>: ` : "";
  return isPrefix ? `${label}${units}%{y:.2f}<extra></extra>` : `${label}%{y:.2f}${units}<extra></extra>`;
}

const LineGraph = props => {
  const {
    data: initialData = [], 
    parentSize, 
    isPrefix = true, 
    units = "$", 
    label = "",
    xAxis = "",
    yAxis = "",
    stacked = false
  } = props;
  const [ data, setData ] = useState([]);
  const [ height, setHeight ] = useState([]);
  const [ width, setWidth ] = useState([]);
  const [ layout, setLayout ] = useState({});

  const divId = label + '-chart-parent';
  
  /* istanbul ignore next */
  useEffect(() => {
    window.addEventListener("resize", (_el) => {
      try {
        let rect = document.getElementById(divId).getBoundingClientRect();
        if (rect.height < 400) {
          rect.height = 400;
        }
        if (rect.width < 400) {
          rect.width = 400;
        }
        setWidth(rect.width);
        setHeight(rect.height)
      } catch (e) {
        console.error(e);
      }
    });
  }, []);

  useEffect(() => {
    const updatedLayout = {
      autosize: true,
      showlegend: initialData.length > 1 ? true : false,
      yaxis: {
        ...(isPrefix && { tickprefix: units }),
        ...(!isPrefix && { tickpostfix: units }),
        ...(yAxis && { title: yAxis })
      },
      xaxis: {
        tickformat: "%b\n%Y",
        ...(xAxis && { title: xAxis })
      },
      legend: {
        ...(stacked && { traceorder: "normal" })
      }
    };

    const startingHeight = parentSize.height - 110 > 400 ? parentSize.height - 110 : 400;
    const startingWidth = parentSize.width - 80 > 400 ? parentSize.width - 80 : 400;
    setLayout(updatedLayout);
    setHeight(startingHeight);
    setWidth(startingWidth);
  }, [ props ]);
  
  useEffect(() => {
    const dataArrays = initialData.map(array => {
      return array.reduce((acc, slice) => {
        const { date, value } = slice;
        return [ [...acc[0], date], [...acc[1], value] ];
      }, [ [],[] ]);
    });

    const updatedData = dataArrays.map(([ x, y ], index) => {
      return {
        x,
        y,
        line: {
          color: colors[index]
        },
        name: (initialData[index][0] || {}).name,
        hovertemplate: getHoverText(isPrefix, units, label),
        connectgaps: true,
        ...(!stacked && { type: 'lines+markers' }),
        ...(stacked && { mode: 'markers+lines' }),
        ...(stacked && { stackgroup:"one" })
      }
    });

    setData(updatedData);
  }, [initialData]);

  return (
    <div id={divId}>
      <Plot 
        id={`${label}-line-chart`}
        data={data}
        layout={layout}
        style={{ width, height }}
        config={{ responsive: true }}
      />
    </div>
  )
};

export default LineGraph;