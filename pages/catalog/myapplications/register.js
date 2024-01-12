import { Breadcrumb } from "react-bootstrap";
import React from "react";
import MyApplicationForm from '../../../components/MyApplicationForm';
import { withRouter } from 'next/router';

const styles = {
  breadcrumb: {
    marginLeft: "-17px",
    marginTop: "-17px",
  },
};

const RegisterApplication = withRouter(({handleClick, router, serverUser}) => {
  const { applicationName, editApplication = false } = router.query;

  return (
    <>
        <Breadcrumb style={styles.breadcrumb}>
          <Breadcrumb.Item>
              <span onClick={() => handleClick("/catalog")}>Catalog</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
              <span onClick={() => handleClick("/catalog/my-applications")}>My Applications</span>
          </Breadcrumb.Item>

          {JSON.parse(editApplication) ? 
          <React.Fragment>
            <Breadcrumb.Item>
              <span onClick={() => handleClick("/catalog/my-applications")}>
                {`${applicationName}`}
              </span>
            </Breadcrumb.Item>
            <Breadcrumb.Item active={true}>Edit</Breadcrumb.Item>
          </React.Fragment>
            :
          <Breadcrumb.Item active={true}>Create</Breadcrumb.Item> }
        </Breadcrumb>
        <MyApplicationForm  
          loggedInUser={serverUser}
          router={router}
          onCancel={() => handleClick("/catalog/my-applications")}
          onSuccess={() => router.push("/catalog/my-applications")}
        />
      </>
  )
})

export default RegisterApplication;
