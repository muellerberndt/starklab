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
import { CompositionDetailsPage } from './pages/CompositionDetails';
import { ConstraintEvaluationPage } from './pages/ConstraintEvaluation';
import { ProverVerifierPage } from './pages/ProverVerifier';
import { FriPage } from './pages/Fri';
import { ZkPage } from './pages/Zk';
import { VerifierPage } from './pages/Verifier';
import { ProofSecurityPage } from './pages/ProofSecurity';

import { ResourcesPage } from './pages/Resources';
import { GlossaryPage } from './pages/Glossary';
import { ImplementationPage } from './pages/Implementation';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
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
            <Route path="composition-details" element={<CompositionDetailsPage />} />
            <Route path="constraint-eval" element={<ConstraintEvaluationPage />} />
            <Route path="prover-verifier" element={<ProverVerifierPage />} />
            <Route path="fri" element={<FriPage />} />
            <Route path="zk" element={<ZkPage />} />
            <Route path="verify" element={<VerifierPage />} />
            <Route path="proof-security" element={<ProofSecurityPage />} />
            <Route path="glossary" element={<GlossaryPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="implementation" element={<ImplementationPage />} />
          </Route>
        </Routes>
      </StarkProvider>
    </BrowserRouter>
  );
}

export default App;
