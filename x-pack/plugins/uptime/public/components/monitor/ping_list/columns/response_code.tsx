/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import styled from 'styled-components';

import { EuiBadge } from '@elastic/eui';

const SpanWithMargin = styled.span`
  margin-right: 16px;
`;

interface Props {
  statusCode: string;
}
export const ResponseCodeColumn = ({ statusCode }: Props) => {
  return (
    <SpanWithMargin>
      <EuiBadge>{statusCode}</EuiBadge>
    </SpanWithMargin>
  );
};
