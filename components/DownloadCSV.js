import { CSVDownload } from "react-csv";
import { MdFileDownload } from 'react-icons/md';
import { Button } from "react-bootstrap";
import { useState, useEffect } from 'react';
import { getUserListForDataset } from '../apis/access';
import ConfirmationModal from '../components/ConfirmationModal';

const DownloadCSV = ({ datasetId = '' }) => {
  const [downloadFile, setDownloadFile] = useState(false);
  const [csvData, setCsvData] = useState(null)
  const [modalBody, setModalBody] = useState(null);


  useEffect(() => {
    setDownloadFile(false);
  }, [downloadFile]);

  async function generateCSV() {
    const data = await getUserListForDataset(datasetId);
    if (data?.error) {
      setModalBody({
        showAcceptOnly: true,
        onAccept: () => setModalBody(null),
        body: (
          <div>
            <div>Unable to download at this time. If this issue persists please report this to <a href="https://johndeere.service-now.com/ep/?id=sc_cat_item&sys_id=fa64d0eb1332a34cb43fbcaf3244b0b5&sysparm_category=45b4546a132e62c00f315d622244b04c" target="_blank"> EDL Support.</a><br></br>{data.error}</div>
          </div>
        )
      });
      console.log(data.error);
    } else {
      setCsvData(data);
      setDownloadFile(true);
    }
  }

  return (
    <>
      <ConfirmationModal id="workflow-create-form-error"
        show={!!modalBody}
        showAcceptOnly={true}
        acceptButtonText="OK"
        body={(modalBody || {}).body}
        onAccept={() => setModalBody(null)}
      />
      <div style={{ display: 'inline', position: 'absolute', right: 0, top: 0 }}>
        <Button
          size='lg'
          variant="none"
          onClick={() => generateCSV()}
        >
          <MdFileDownload />
        </Button>
      </div>
      {!!downloadFile && csvData?.data?.length && <CSVDownload data={csvData.data} headers={csvData.datasetReportHeader} target="_blank" />}
    </>

  )
}

export default DownloadCSV;
