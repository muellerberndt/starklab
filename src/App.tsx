import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StarkProvider } from './contexts/StarkContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ProtocolPage } from './pages/Protocol';
import { PolynomialsPage } from './pages/Polynomials';
import { MathPage } from './pages/Math';
import { EncodingPage } from './pages/Encoding';
import { TracePage } from './pages/Trace';
import { CommitmentsPage } from './pages/Commitments';
import { CompositionPage } from './pages/Composition';
import { ConstraintEvaluationPage } from './pages/ConstraintEvaluation';
import { FriPage } from './pages/Fri';
import { ZkPage } from './pages/Zk';
import { VerifierPage } from './pages/Verifier';

import { ResourcesPage } from './pages/Resources';
import { FAQPage } from './pages/FAQ';

function App() {
  return (
    <BrowserRouter>
      <StarkProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="protocol" element={<ProtocolPage />} />
            <Route path="math" element={<MathPage />} />
            <Route path="encoding" element={<EncodingPage />} />
            <Route path="trace" element={<TracePage />} />
            <Route path="polynomials" element={<PolynomialsPage />} />
            <Route path="commitments" element={<CommitmentsPage />} />
            <Route path="composition" element={<CompositionPage />} />
            <Route path="constraint-eval" element={<ConstraintEvaluationPage />} />
            <Route path="fri" element={<FriPage />} />
            <Route path="zk" element={<ZkPage />} />
            <Route path="verify" element={<VerifierPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="resources" element={<ResourcesPage />} />
          </Route>
        </Routes>
      </StarkProvider>
    </BrowserRouter>
  );
}

export default App;
