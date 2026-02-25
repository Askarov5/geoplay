// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'GeoPlay';

  @override
  String get homeSubtitle => 'Master the globe.';

  @override
  String get difficultyEasy => 'Easy';

  @override
  String get difficultyMedium => 'Medium';

  @override
  String get difficultyHard => 'Hard';

  @override
  String get continentAll => 'All';

  @override
  String get continentEurope => 'Europe';

  @override
  String get continentAsia => 'Asia';

  @override
  String get continentAfrica => 'Africa';

  @override
  String get continentNorthAmerica => 'N. America';

  @override
  String get continentSouthAmerica => 'S. America';

  @override
  String get continentOceania => 'Oceania';

  @override
  String get poolLabelEasy => 'well-known';

  @override
  String get poolLabelMedium => 'most';

  @override
  String get poolLabelHard => 'all';

  @override
  String get commonPlayAgain => 'Play Again';

  @override
  String get commonHome => 'Home';

  @override
  String get commonGo => 'GO';

  @override
  String get commonSkip => 'Skip';

  @override
  String get commonScore => 'Score';

  @override
  String get commonTime => 'Time';

  @override
  String get commonCorrect => 'Correct';

  @override
  String get commonWrong => 'Wrong';

  @override
  String get commonRound => 'Round';

  @override
  String get commonStreak => 'Streak';

  @override
  String get commonBestStreak => 'Best Streak';

  @override
  String get commonGetReady => 'Get ready!';

  @override
  String get commonTimeUp => 'TIME UP';

  @override
  String get commonPerfect => 'PERFECT!';

  @override
  String get commonGreat => 'GREAT!';

  @override
  String get commonGood => 'Good!';

  @override
  String get commonNiceTry => 'Nice try!';

  @override
  String get gameConnectTitle => 'Connect Countries';

  @override
  String get gameConnectDesc => 'Find a path between two countries';

  @override
  String get gameSilhouetteTitle => 'Find the Country';

  @override
  String get gameSilhouetteDesc => 'Identify countries by their shape';

  @override
  String get gameFlagSprintTitle => 'Flag Sprint';

  @override
  String get gameFlagSprintDesc => 'Identify as many flags as possible';

  @override
  String get gameCapitalClashTitle => 'Capital Clash';

  @override
  String get gameCapitalClashDesc => 'Match capitals to countries';

  @override
  String get gameBorderBlitzTitle => 'Border Blitz';

  @override
  String get gameBorderBlitzDesc => 'Name all neighboring countries';

  @override
  String get gameMapQuizTitle => 'Find on Map';

  @override
  String get gameMapQuizDesc => 'Tap the correct country on the globe';

  @override
  String get gameFlashcardsTitle => 'Flashcards';

  @override
  String get gameFlashcardsDesc => 'Study countries at your own pace';

  @override
  String get flagSprintWhichCountry => 'Which country\'s flag is this?';

  @override
  String capitalClashCapitalOf(String country) {
    return 'What is the capital of $country?';
  }

  @override
  String capitalClashCountryWith(String capital) {
    return 'Which country has the capital $capital?';
  }

  @override
  String get typeCountryName => 'Type country name...';

  @override
  String get typeCapitalName => 'Type capital name...';

  @override
  String get swipeUpForGames => 'Swipe up for games';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get settingsTheme => 'Theme';

  @override
  String get settingsLanguage => 'Language';

  @override
  String get settingsSound => 'Sound';
}
