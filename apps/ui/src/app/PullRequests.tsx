import styled from '@emotion/styled';
import { gql, useQuery } from '@apollo/client';
import { PullRequestView } from '@testapp/types';
import { useEffect } from 'react';

const Section = styled.div`
  margin: 2em 0;
`;

const SectionTitle = styled.div`
  font-weight: 700;
`;

const PullRequest = styled.div`
  border-radius: 5px;
  border: 2px solid green;
  background: #ccc;
  padding: 2em;

  h2 {
    margin-bottom: 0.25em;
  }
`;

const OpenRequests = styled.div`
  display: grid;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-auto-flow: row;
`;

const GET_ALL_PRS = gql`
  query GetAllPullRequests {
    prs: getAllPullRequests {
      authorUserName
      title
      url
      number
      wasApproved
      isResolved
      resolution
      reviews {
        userName
        outcome
      }
      pendingReviewers {
        userName
      }
    }
  }
`;

const PR_SUBSCRIPTION = gql`
  subscription Watch {
    pullRequestUpdated {
      authorUserName
      title
      url
      number
      wasApproved
      isResolved
      resolution
      reviews {
        userName
        outcome
      }
      pendingReviewers {
        userName
      }
    }
  }
`;

export const PullRequests = () => {
  const { loading, data, subscribeToMore } = useQuery(GET_ALL_PRS, {
    variables: { language: 'english' },
  });

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: PR_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;

        const oldPrs: PullRequestView[] = prev.prs as PullRequestView[];
        const updatedPr: PullRequestView = subscriptionData.data
          .pullRequestUpdated as PullRequestView;

        let isNewPr = true;
        const updatedPrs = oldPrs.map((oldPr) => {
          if (updatedPr.url === oldPr.url) {
            isNewPr = false;
            return updatedPr;
          }

          return oldPr;
        });

        return {
          prs: isNewPr ? [...updatedPrs, updatedPr] : updatedPrs,
        };
      },
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeToMore]);

  if (loading) return <p>Loading ...</p>;

  return (
    <OpenRequests>
      {(data.prs as PullRequestView[]).map(
        ({
          title,
          url,
          number,
          pendingReviewers,
          reviews,
          authorUserName,
          wasApproved: isMergeable,
        }) => (
          <PullRequest key={number}>
            <h2>
              <a href={url} target="_blank" rel="noreferrer">
                {title} (#{number})
              </a>
            </h2>
            <div>by @{authorUserName}</div>

            {pendingReviewers.length ? (
              <Section>
                <SectionTitle>pending reviewers...</SectionTitle>
                <ul>
                  {pendingReviewers.map(({ userName }, i) => (
                    <li key={`${userName}_${i}`}>@{userName}</li>
                  ))}
                </ul>
              </Section>
            ) : (
              <div />
            )}
            {reviews.length ? (
              <Section>
                <SectionTitle>reviewed by...</SectionTitle>
                <ul>
                  {reviews.map(({ userName, outcome }, i) => (
                    <li key={`${userName}_${i}`}>
                      @{userName}{' '}
                      {outcome === 'approved' ? (
                        <span role="image" aria-label="approved">
                          ✅
                        </span>
                      ) : (
                        <span role="image" aria-label="requested changes">
                          ❌
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : (
              <div />
            )}
            {isMergeable ? <div>READY TO MERGE!!</div> : <div />}
          </PullRequest>
        ),
      )}
    </OpenRequests>
  );
};
