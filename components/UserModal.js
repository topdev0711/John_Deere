import { useEffect, useState } from "react";
import { Button, Modal, Table } from "react-bootstrap";
import {  MdKeyboardArrowRight, MdKeyboardArrowLeft } from 'react-icons/md'
import EmailableText from "./EmailableText";
import utils from "./utils";

const styles = {
  link: { margin: '-7px', marginTop: '-11px', color: '#666' },
  italicLink: { margin: '-7px', marginTop: '-11px', color: '#666', fontStyle: 'italic' },
  selectBox: {
    float: 'right',
    marginTop: '-6px',
    marginRight: '-35px'
  },
};

async function getUsers(groupName, query) {
  const uri = `/api/group/${groupName}/users${query}`;
  return fetch(uri, {
    credentials: 'same-origin',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function createEmailList(users) {
  const emails = users.map(({ email }) => email);
  return `mailto:${emails.join(';')}`;
}

const UserModal = ({ linkName = '', groupName = '', useItalics = false, isCommunity = false }) => {
  const [ users, setUsers ] = useState([]);
  const [ showModal, setShowModal ] = useState(false);
  const [ error, setError ] = useState('');
  const [ queries, setQueries ] = useState([]);
  const [ query, setQuery ] = useState('');
  const [ firstUser, setFirstUser ] = useState('');
  const [ isLoading, setIsLoading ] = useState(false);
  const [ lastQuery, setLastQuery ] = useState('');
  const [ maxUsersHit, setMaxUsersHit ] = useState(false);
  const currentFirstUser = users[0] || {};
  const currentFirstName = currentFirstUser.displayName || '';
  const hideNext = users.length < 10 || buildQuery('next') === lastQuery || error;
  const hidePrevious = firstUser === currentFirstName || error;

  useEffect(() => {
    async function populateUsers() {
      if(showModal) {
        setIsLoading(true);
        try {
          const response = await getUsers(groupName, query);
          if (response.ok) {
            const loadedUsers = await response.json();
            if (loadedUsers.length) {
              setUsers(loadedUsers);
            } else {
              setLastQuery(query);
            }
            setIsLoading(false);
          } else {
            const error = await response.json();
            console.error(error)
            setError(error.error);
          }
        } catch (error) {
          console.error(error)
          setError('An unexpected issue occurred when retrieving group members.')
        }
      }
    }
    populateUsers();
  }, [ groupName, query, showModal ]);

  useEffect(() => {
    if (!query) {
      setFirstUser(currentFirstName);
    }
  }, [ users ]);

  useEffect(() => {
    if(!queries.includes('query')) {
      setQueries([...queries, query]);
    }
  }, [ query ]);

  async function emailFirstUsers() {
    try {
      const response = await getUsers(groupName, '?loadFirst=true');
      if (response.ok) {
        const loadedUsers = await response.json();
        if (loadedUsers.length === 100) setMaxUsersHit(true);
        utils.sendEmail(`${createEmailList(loadedUsers)}?subject=Group Members of ${groupName}`);
        setIsLoading(false);
      } else {
        const error = await response.json();
        console.error(error)
        setError(error.error);
      }
    } catch (err) {
      console.error(error);
      setError('An unexpected error occured when emailing users.');
    }
  }

  function handleEmailAll() {
    if (isCommunity) utils.sendEmail(`mailto:${groupName.replace(/\s/g, '')}@johndeere.com`);
    else emailFirstUsers();
  }

  function buildQuery(next) {
    return next ? `?after=${users[users.length - 1].id}` : queries[queries.indexOf(query) - 1];
  }

  return (
      <>
        <Modal show={showModal} id={`${groupName}-modal`} size='lg'>
          <Modal.Header>
            <Modal.Title>
              Group Members of {groupName}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error ?
                error :
                <Table hover striped>
                  <tbody>
                  {
                    users.map(({ displayName, email }, index) => {
                      return (
                          <tr key={`users-${groupName}-${index}`}>
                            <td>
                              <EmailableText email={email} placement='right'>{displayName}</EmailableText>
                            </td>
                          </tr>
                      );
                    })
                  }
                  </tbody>
                </Table>
            }
            <span>
            <Button
                id={`${groupName}-previous`}
                disabled={isLoading}
                hidden={hidePrevious}
                size='sm'
                variant="link"
                onClick={() => setQuery(buildQuery(false))}
            >
              <MdKeyboardArrowLeft />
              Previous 10
            </Button>
            <Button
                id={`${groupName}-next`}
                disabled={isLoading}
                hidden={hideNext}
                size='sm'
                variant="link"
                style={{ float: 'right' }}
                onClick={() => setQuery(buildQuery(true))}
            >
              Next 10
              <MdKeyboardArrowRight />
            </Button>
          </span>
          </Modal.Body>
          <Modal.Footer>
            <div
                id={`${groupName}-max-alert`}
                hidden={!maxUsersHit}
                style={{ paddingRight: '22%' }}
            >
              <i>Only the first 100 users were included in this email.</i>
            </div>
            <Button
                id={`${groupName}-email`}
                variant="secondary"
                onClick={() => handleEmailAll()}
                disabled={isLoading || error}
            >
              Email All
            </Button>
            <Button
                id={`${groupName}-close`}
                onClick={() => setShowModal(false)}
                variant="primary"
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
        <Button
            id={`${groupName}-button`}
            style={useItalics ? styles.italicLink : styles.link}
            size="sm"
            variant="link"
            onClick={() => setShowModal(true)}
        >
          {linkName}
        </Button>
      </>
  );
};

export default UserModal;