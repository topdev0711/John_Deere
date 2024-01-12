import Link from 'next/link';
import { Alert } from 'react-bootstrap';
import utils from './utils';
import EmailableText from './EmailableText';
import {getLoggedInUser} from "./AppState";
import DeletePendingChange from './datasets/details/DeletePendingChange';

const Banner = ({variant="warning", children}) => <Alert variant={variant}><div className="text-muted small mb-0">{children}</div></Alert>;

/* istanbul ignore next */
const Alerts = ({record = {}, type, nonAvailableVersion, isCustodian }) => {
  const username = getLoggedInUser()?.username;
  const isLegacyLocked = !!record.lockedBy && typeof record.lockedBy === 'string';
  const isLocked = !!record.lockedBy && typeof record.lockedBy === 'object';
  const isLockedByUser = (isLegacyLocked && record?.lockedBy === username) || (isLocked && record?.lockedBy?.username === username);
  const pendingDatasetLink = <Link style={{cursor: 'pointer', textDecoration: 'underline', color: 'rgb(102, 102, 102)'}} href={`/catalog/${type}s/detail?id=${record.id}&version=${nonAvailableVersion}`}>here</Link>

  return (
    <>
      {nonAvailableVersion > 0 &&
        <Banner>This {type} has a version pending approval. Editing is not allowed until this {type} is made available. To view the pending changes click&nbsp;{pendingDatasetLink}.</Banner>
      }
      {isLegacyLocked && record.lockedBy !== username &&
        <Banner>This {type} has been locked by {record.lockedBy}. Editing is not allowed until {record.lockedBy} has finished or canceled editing.</Banner>
      }
      {isLocked && record.lockedBy.username !== username &&
        <Banner>
          This {type} has been locked by <EmailableText>{record.lockedBy.name}</EmailableText> since {utils.formatDate(record.lockedBy.lockDate)}.
          Editing is not allowed until the change has been submitted or canceled by <EmailableText>{record.lockedBy.name}</EmailableText> or the dataset's custodian.
        </Banner>
      }
      {isLockedByUser &&
        <Banner>{`You have locked this ${type}. Editing is now prevented for other users until you cancel or submit your changes.`}</Banner>
      }
      {record.status !== 'DELETED' && !!record.isPendingDelete &&
        <Banner variant="danger">This {type} is pending deletion. If approved this dataset and all associated data will be removed from EDL and the EDL Data Catalog.</Banner>
      }
      {record.status === 'DELETED' &&
        <Banner variant="danger">This {type} has already been deleted.</Banner>
      }
      {record.status === 'PENDING' && utils.isPendingPublishAction(record) &&
        <Banner>This {type} has a pending publish action. Editing is not allowed until this pending publish change is approved/rejected or cancelled.</Banner>
      }
      {(record.status === 'REJECTED' || record.status === 'PENDING' || record.status === 'APPROVED') && isCustodian && type === 'dataset' &&
        <Banner>
          This {type} has pending changes. Editing is not allowed until pending changes are deleted
          <DeletePendingChange dataset={record} />
        </Banner>
      }
    </>
  )
}
export default Alerts;