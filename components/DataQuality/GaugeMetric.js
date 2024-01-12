import { Card } from 'react-bootstrap';

const meterRadius = 100;
const strokeSize = meterRadius / 4;
const pointerRadius = strokeSize / 3;
const height = meterRadius + strokeSize / 2,
    width = 2 * meterRadius + strokeSize;
const cardWidth = width + meterRadius;

const getAngle = (theta, meterRadius) => [
    meterRadius * Math.sin(Math.PI * 2 * theta / 360),
    -meterRadius * Math.cos(Math.PI * 2 * theta / 360)
];

const GaugeMetric = ({ status = "None", value = 0 }) => {
    const theta = 1.8 * value - 90;
    const pointer = getAngle(theta, meterRadius - strokeSize);
    const rightCorner = getAngle(theta + 90, pointerRadius);
    const leftCorner = getAngle(theta - 90, pointerRadius);
    const statusFontSize = strokeSize <= 20 ? 10 : strokeSize / 2;
    const valueXPos = isNaN(value) ? '43' : 50 - ((value.toString().length + 1) * statusFontSize / 2 / width * 100);
    return (
        <div>
            <Card className='text-center' style={{ width: `${cardWidth}px`, height: `${height + strokeSize * 3}px`, margin: '1.1em' }}>
                <Card.Body id="metric-wrapper" className='text-center' style={{
                    width: '100%', height: '100%', padding: '1.2em',
                    boxShadow: '0 1px 8px #bbb'
                }}>
                    <svg style={{ width: `${width}px`, height: `${height + pointerRadius}px` }}>
                        <defs>
                            <linearGradient id="linearColors" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="rgb(255, 55, 0)" />
                                <stop offset="8%" stopColor="rgba(255, 55, 0, 0.8)" />
                                <stop offset="22.5%" stopColor="rgba(255, 160, 0, 0.8)" />
                                <stop offset="40%" stopColor="rgba(255, 200, 0, 0.7)" />
                                <stop offset="60%" stopColor="rgba(255, 225, 0, 0.7)" />
                                <stop offset="77.5%" stopColor="rgba(230, 225, 0, 0.8)" />
                                <stop offset="92%" stopColor="rgba(70, 160, 30, 0.8)" />
                                <stop offset="100%" stopColor="rgb(50, 180, 10)" />
                            </linearGradient>
                        </defs>
                        <svg id="meter-gauge" style={{ transform: 'translate(0%,100%)' }} >
                            <circle r={meterRadius} cx="50%" cy={height}
                                stroke="url(#linearColors)"
                                strokeWidth={strokeSize} strokeDasharray={"0 " + (2 * Math.PI * meterRadius) / 2 + " 0"} fill="none">
                            </circle>
                        </svg>
                        <svg id="meter-pointer" style={{ transform: 'translate(0%,100%)', opacity: 0.8 }} >
                            <polygon points={`${pointer[0]},${pointer[1]} ${leftCorner[0]},${leftCorner[1]} ${rightCorner[0]},${rightCorner[1]}`}
                                style={{ transform: `translate(50%,${height}px)` }} />
                            <circle cx="50%" cy={height} r={pointerRadius} />
                        </svg>
                        <text x={`${valueXPos}%`} y="60%" style={{ fontSize: strokeSize }} id='meter-value'>{value}%</text>
                    </svg>
                    <Card.Text className='text-center' style={{ fontSize: `${statusFontSize}px`, color: 'gray', padding: '1.2em' }}>
                        <b>Expected Update: </b><em>{status}</em>
                    </Card.Text>
                </Card.Body>
            </Card>
        </div >
    )
}

export default GaugeMetric;