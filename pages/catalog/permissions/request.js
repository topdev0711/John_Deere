import { Breadcrumb } from 'react-bootstrap'
import Spacer from '../../../components/Spacer'
import PermissionForm from '../../../components/PermissionForm'
import { withRouter } from 'next/router'

const styles = {
  breadcrumb: {
    marginLeft: '-17px',
    marginTop: '-17px'
  }
}

const RegisterPermission = withRouter(({handleClick, router}) => {
  const url = router.query.ref === 'datasets' ? '/catalog' : '/catalog/permissions'
  return (
    <>
      <Breadcrumb style={styles.breadcrumb}>
        <Breadcrumb.Item>
          <a onClick={() => handleClick(url)}><span>Catalog</span></a>
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Request Access</Breadcrumb.Item>
      </Breadcrumb>
      <PermissionForm isEditing={false} onCancel={() => router.push(url)} />
      <Spacer />
    </>
  )
})

export default RegisterPermission;
