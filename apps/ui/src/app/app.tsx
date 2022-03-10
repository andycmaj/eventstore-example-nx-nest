import styled from '@emotion/styled';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { PullRequests } from './PullRequests';

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'http://localhost:3333/graphql',
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
