import React from 'react';
import {Button} from 'react-bootstrap';
import {MdCompareArrows} from 'react-icons/md';

const hasDiffButton = ({status}, latestAvailableVersion) => status === 'PENDING' && latestAvailableVersion;

const DiffButton = ({showDiff, setShowDiff}) => {
  const handleClick = () => setShowDiff(!showDiff);
  const diffText = !!showDiff ? 'Hide Changes' : 'Show Changes';
  return <Button id='diff-button' onClick={handleClick} size="sm" variant="outline-primary"><MdCompareArrows/> {diffText}</Button>;
}

export const getDiffButton = (dataset, latestAvailableVersion, showDiff, setShowDiff) => {
  return hasDiffButton(dataset, latestAvailableVersion) ? <DiffButton showDiff={showDiff} setShowDiff={setShowDiff}/> : undefined;
};
