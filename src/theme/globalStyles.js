import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    transition: ${props => props.theme.transition};
  }

  body {
    background-color: ${props => props.theme.background.primary};
    color: ${props => props.theme.text.primary};
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${props => props.theme.text.heading};
  }

  button, 
  .MuiButton-root {
    background-color: ${props => props.theme.button.base} !important;
    color: ${props => props.theme.text.primary} !important;

    &:hover {
      background-color: ${props => props.theme.button.hover} !important;
    }
  }

  .MuiPaper-root {
    background-color: ${props => props.theme.background.secondary} !important;
    color: ${props => props.theme.text.primary} !important;
  }

  .MuiCard-root {
    background-color: ${props => props.theme.background.secondary};
    transition: transform 0.3s ease-in-out;

    &:hover {
      transform: translateY(-2px);
    }
  }

  input, 
  .MuiTextField-root {
    background-color: ${props => props.theme.background.secondary} !important;
    color: ${props => props.theme.text.primary} !important;

    .MuiInputBase-input {
      color: ${props => props.theme.text.primary} !important;
    }

    .MuiOutlinedInput-notchedOutline {
      border-color: ${props => props.theme.button.base} !important;
    }

    &:hover .MuiOutlinedInput-notchedOutline,
    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: ${props => props.theme.button.hover} !important;
    }
  }
`;
