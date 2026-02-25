import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[Locale('en')];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'GeoPlay'**
  String get appTitle;

  /// No description provided for @homeSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Master the globe.'**
  String get homeSubtitle;

  /// No description provided for @difficultyEasy.
  ///
  /// In en, this message translates to:
  /// **'Easy'**
  String get difficultyEasy;

  /// No description provided for @difficultyMedium.
  ///
  /// In en, this message translates to:
  /// **'Medium'**
  String get difficultyMedium;

  /// No description provided for @difficultyHard.
  ///
  /// In en, this message translates to:
  /// **'Hard'**
  String get difficultyHard;

  /// No description provided for @continentAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get continentAll;

  /// No description provided for @continentEurope.
  ///
  /// In en, this message translates to:
  /// **'Europe'**
  String get continentEurope;

  /// No description provided for @continentAsia.
  ///
  /// In en, this message translates to:
  /// **'Asia'**
  String get continentAsia;

  /// No description provided for @continentAfrica.
  ///
  /// In en, this message translates to:
  /// **'Africa'**
  String get continentAfrica;

  /// No description provided for @continentNorthAmerica.
  ///
  /// In en, this message translates to:
  /// **'N. America'**
  String get continentNorthAmerica;

  /// No description provided for @continentSouthAmerica.
  ///
  /// In en, this message translates to:
  /// **'S. America'**
  String get continentSouthAmerica;

  /// No description provided for @continentOceania.
  ///
  /// In en, this message translates to:
  /// **'Oceania'**
  String get continentOceania;

  /// No description provided for @poolLabelEasy.
  ///
  /// In en, this message translates to:
  /// **'well-known'**
  String get poolLabelEasy;

  /// No description provided for @poolLabelMedium.
  ///
  /// In en, this message translates to:
  /// **'most'**
  String get poolLabelMedium;

  /// No description provided for @poolLabelHard.
  ///
  /// In en, this message translates to:
  /// **'all'**
  String get poolLabelHard;

  /// No description provided for @commonPlayAgain.
  ///
  /// In en, this message translates to:
  /// **'Play Again'**
  String get commonPlayAgain;

  /// No description provided for @commonHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get commonHome;

  /// No description provided for @commonGo.
  ///
  /// In en, this message translates to:
  /// **'GO'**
  String get commonGo;

  /// No description provided for @commonSkip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get commonSkip;

  /// No description provided for @commonScore.
  ///
  /// In en, this message translates to:
  /// **'Score'**
  String get commonScore;

  /// No description provided for @commonTime.
  ///
  /// In en, this message translates to:
  /// **'Time'**
  String get commonTime;

  /// No description provided for @commonCorrect.
  ///
  /// In en, this message translates to:
  /// **'Correct'**
  String get commonCorrect;

  /// No description provided for @commonWrong.
  ///
  /// In en, this message translates to:
  /// **'Wrong'**
  String get commonWrong;

  /// No description provided for @commonRound.
  ///
  /// In en, this message translates to:
  /// **'Round'**
  String get commonRound;

  /// No description provided for @commonStreak.
  ///
  /// In en, this message translates to:
  /// **'Streak'**
  String get commonStreak;

  /// No description provided for @commonBestStreak.
  ///
  /// In en, this message translates to:
  /// **'Best Streak'**
  String get commonBestStreak;

  /// No description provided for @commonGetReady.
  ///
  /// In en, this message translates to:
  /// **'Get ready!'**
  String get commonGetReady;

  /// No description provided for @commonTimeUp.
  ///
  /// In en, this message translates to:
  /// **'TIME UP'**
  String get commonTimeUp;

  /// No description provided for @commonPerfect.
  ///
  /// In en, this message translates to:
  /// **'PERFECT!'**
  String get commonPerfect;

  /// No description provided for @commonGreat.
  ///
  /// In en, this message translates to:
  /// **'GREAT!'**
  String get commonGreat;

  /// No description provided for @commonGood.
  ///
  /// In en, this message translates to:
  /// **'Good!'**
  String get commonGood;

  /// No description provided for @commonNiceTry.
  ///
  /// In en, this message translates to:
  /// **'Nice try!'**
  String get commonNiceTry;

  /// No description provided for @gameConnectTitle.
  ///
  /// In en, this message translates to:
  /// **'Connect Countries'**
  String get gameConnectTitle;

  /// No description provided for @gameConnectDesc.
  ///
  /// In en, this message translates to:
  /// **'Find a path between two countries'**
  String get gameConnectDesc;

  /// No description provided for @gameSilhouetteTitle.
  ///
  /// In en, this message translates to:
  /// **'Find the Country'**
  String get gameSilhouetteTitle;

  /// No description provided for @gameSilhouetteDesc.
  ///
  /// In en, this message translates to:
  /// **'Identify countries by their shape'**
  String get gameSilhouetteDesc;

  /// No description provided for @gameFlagSprintTitle.
  ///
  /// In en, this message translates to:
  /// **'Flag Sprint'**
  String get gameFlagSprintTitle;

  /// No description provided for @gameFlagSprintDesc.
  ///
  /// In en, this message translates to:
  /// **'Identify as many flags as possible'**
  String get gameFlagSprintDesc;

  /// No description provided for @gameCapitalClashTitle.
  ///
  /// In en, this message translates to:
  /// **'Capital Clash'**
  String get gameCapitalClashTitle;

  /// No description provided for @gameCapitalClashDesc.
  ///
  /// In en, this message translates to:
  /// **'Match capitals to countries'**
  String get gameCapitalClashDesc;

  /// No description provided for @gameBorderBlitzTitle.
  ///
  /// In en, this message translates to:
  /// **'Border Blitz'**
  String get gameBorderBlitzTitle;

  /// No description provided for @gameBorderBlitzDesc.
  ///
  /// In en, this message translates to:
  /// **'Name all neighboring countries'**
  String get gameBorderBlitzDesc;

  /// No description provided for @gameMapQuizTitle.
  ///
  /// In en, this message translates to:
  /// **'Find on Map'**
  String get gameMapQuizTitle;

  /// No description provided for @gameMapQuizDesc.
  ///
  /// In en, this message translates to:
  /// **'Tap the correct country on the globe'**
  String get gameMapQuizDesc;

  /// No description provided for @gameFlashcardsTitle.
  ///
  /// In en, this message translates to:
  /// **'Flashcards'**
  String get gameFlashcardsTitle;

  /// No description provided for @gameFlashcardsDesc.
  ///
  /// In en, this message translates to:
  /// **'Study countries at your own pace'**
  String get gameFlashcardsDesc;

  /// No description provided for @flagSprintWhichCountry.
  ///
  /// In en, this message translates to:
  /// **'Which country\'s flag is this?'**
  String get flagSprintWhichCountry;

  /// No description provided for @capitalClashCapitalOf.
  ///
  /// In en, this message translates to:
  /// **'What is the capital of {country}?'**
  String capitalClashCapitalOf(String country);

  /// No description provided for @capitalClashCountryWith.
  ///
  /// In en, this message translates to:
  /// **'Which country has the capital {capital}?'**
  String capitalClashCountryWith(String capital);

  /// No description provided for @typeCountryName.
  ///
  /// In en, this message translates to:
  /// **'Type country name...'**
  String get typeCountryName;

  /// No description provided for @typeCapitalName.
  ///
  /// In en, this message translates to:
  /// **'Type capital name...'**
  String get typeCapitalName;

  /// No description provided for @swipeUpForGames.
  ///
  /// In en, this message translates to:
  /// **'Swipe up for games'**
  String get swipeUpForGames;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @settingsTheme.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get settingsTheme;

  /// No description provided for @settingsLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get settingsLanguage;

  /// No description provided for @settingsSound.
  ///
  /// In en, this message translates to:
  /// **'Sound'**
  String get settingsSound;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
