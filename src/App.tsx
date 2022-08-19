import { Layout } from '@busybox/react-components';

function App() {
  return (
    <Layout.Page data-testid={'app'}>
      <Layout.Header>Header</Layout.Header>
      <Layout.Content>
        <Layout.Main>Main Content</Layout.Main>
      </Layout.Content>
      <Layout.Footer>Footer</Layout.Footer>
    </Layout.Page>
  );
}

export default App;
