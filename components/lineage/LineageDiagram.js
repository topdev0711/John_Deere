// Unpublished Work © 2022 Deere & Company.
import Diagram, { useSchema } from "beautiful-react-diagrams";

const LineageDiagram = ({ schema }) => {
    const [diagramSchema, { onChange }] = useSchema(schema);

    return (
        <div style={{ textAlign: 'center', position: 'relative', height: '40rem' }}>
            <Diagram schema={diagramSchema} onChange={onChange} />
        </div>
    );
}

export default LineageDiagram;