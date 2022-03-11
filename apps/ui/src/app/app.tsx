import styled from '@emotion/styled';
import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  split,
} from '@apollo/client';
import { PullRequests } from './PullRequests';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';

const httpLink = new HttpLink({
  uri: 'http://localhost:3333/graphql',
});

const wsLink = new WebSocketLink({
  uri: 'ws://localhost:3333/graphql',
  options: {
    timeout: 60000,
    reconnect: true,
  },
});

// const wsLink = new GraphQLWsLink(
//   createClient({
//     url: 'ws://localhost:3333/graphql',
//     lazyCloseTimeout: 60000,
//     retryAttempts: 3,
//   }),
// );

// The split function takes three parameters:
//
// * A function that's called for each operation to execute
// * The Link to use for an operation if the function returns a "truthy" value
// * The Link to use for an operation if the function returns a "falsy" value
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: splitLink,
});

const StyledApp = styled.div`
  // Your style here
`;

export function App() {
  return (
    <ApolloProvider client={client}>
      <StyledApp>
        <PullRequests />
      </StyledApp>
    </ApolloProvider>
  );
}

export default App;
