import React from 'react';
import {
  ChakraProvider,
  Container,
  Flex,
  Box,
  Link as ChakraLink,
  Text,
  IconButton,
  useColorMode,
  extendTheme,
} from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import SurveyForm from './SurveyForm';
import AnalyticsDashboard from './AnalyticsDashboard';
import FeedbackHistory from './FeedbackHistory';
import SurveysList from './SurveysList';
import './i18n';

const theme = extendTheme({
  fonts: {
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  colors: {
    brand: {
      50: '#e6fffa',
      100: '#b5f5ec',
      200: '#81ecec',
      300: '#4fd1c5',
      400: '#38b2ac',
      500: '#319795',
      600: '#2c7a7b',
      700: '#285e61',
      800: '#234e52',
      900: '#1a3c34',
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'md',
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.800',
      },
    },
  },
});

const App = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Flex
          as="nav"
          bg="brand.500"
          p={4}
          color="white"
          justifyContent="space-between"
          alignItems="center"
          boxShadow="md"
        >
          <Text fontSize="xl" fontWeight="bold">
            SurveyPro
          </Text>
          <Box>
            <ChakraLink
              as={Link}
              to="/"
              px={4}
              fontWeight="medium"
              _hover={{ textDecoration: 'underline', color: 'brand.200' }}
            >
              Survey Form
            </ChakraLink>
            <ChakraLink
              as={Link}
              to="/analytics"
              px={4}
              fontWeight="medium"
              _hover={{ textDecoration: 'underline', color: 'brand.200' }}
            >
              Analytics Dashboard
            </ChakraLink>
            <ChakraLink
              as={Link}
              to="/history"
              px={4}
              fontWeight="medium"
              _hover={{ textDecoration: 'underline', color: 'brand.200' }}
            >
              Feedback History
            </ChakraLink>
            <ChakraLink
              as={Link}
              to="/surveys"
              px={4}
              fontWeight="medium"
              _hover={{ textDecoration: 'underline', color: 'brand.200' }}
            >
              Surveys
            </ChakraLink>
            <IconButton
              aria-label="Toggle theme"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              ml={4}
              variant="ghost"
              color="white"
              _hover={{ bg: 'brand.600' }}
            />
          </Box>
        </Flex>

        <Container maxW="container.xl" py={10}>
          <Routes>
            <Route exact path="/" element={<SurveyForm />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/history" element={<FeedbackHistory />} />
            <Route path="/surveys" element={<SurveysList />} />
          </Routes>
        </Container>
      </Router>
    </ChakraProvider>
  );
};

export default App;