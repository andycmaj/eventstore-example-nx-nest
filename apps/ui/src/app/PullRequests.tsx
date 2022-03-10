import styled from '@emotion/styled';
import { gql, useQuery, useSubscription } from '@apollo/client';

const GET_ALL_PRS = gql`
  query GetAllPullRequests {
    getAllPullRequests {
      authorUserName
      title
      url
      wasApproved
      isResolved
      resolution
      reviews {
        userName
        outcome
      }
    }
  }
`;

export const PullRequests = () => {
  const { loading, error, data } = useQuery(GET_ALL_PRS, {
    variables: { language: 'english' },
  });
  if (loading) return <p>Loading ...</p>;

  return <div>{JSON.stringify(data, null, 2)}</div>;
};
