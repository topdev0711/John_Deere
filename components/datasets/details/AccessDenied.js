import { useRouter } from 'next/router';
import React from 'react';
import {Button} from 'react-bootstrap';

export const AccessDenied = () => {
  const router = useRouter();

  return (
    <div class="d-flex align-items-center justify-content-center">
      <div class="text-center">
        <h1 class="display-3 fw-bold">403</h1>
        <p class="lead"> <span class="text-danger">Oops!</span> Access Denied! </p>
        <p class="lead">
          The dataset you've requested is visible to custodians only.
        </p>
        <Button onClick={() => router.push('/catalog')}>Go to catalog</Button>
      </div>
    </div>
  );
}