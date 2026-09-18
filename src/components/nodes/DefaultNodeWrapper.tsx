import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { MessageNode } from './MessageNode';
import { InputNameNode } from './InputNameNode';
import { InputEmailNode } from './InputEmailNode';
import { AddTagNode } from './AddTagNode';

export const DefaultNodeWrapper = memo((props: NodeProps) => {
  const { data } = props;

  switch (data?.type) {
    case 'message':
      return <MessageNode {...props} />;
    case 'input_name':
      return <InputNameNode {...props} />;
    case 'input_email':
      return <InputEmailNode {...props} />;
    case 'add_tag':
      return <AddTagNode {...props} />;
    default:
      // Se não tiver type ou for desconhecido, cai pro message por precaução
      return <MessageNode {...props} />;
  }
});

DefaultNodeWrapper.displayName = 'DefaultNodeWrapper';
